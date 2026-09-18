/**
 * JSONZero — Web Worker Client Manager
 *
 * Coordinates execution of JSON operations between synchronous main-thread processing
 * (for small JSON to avoid serialization cost) and native Web Worker processing
 * (for large JSON to prevent blocking the UI).
 */

import type {
  WorkerOperation,
  WorkerPayloadMap,
  WorkerResultMap,
  WorkerRequest,
  WorkerResponse,
} from './types'
import { processWorkerOperation } from './json.worker'

/** Size threshold: payloads smaller than 100 KB are executed directly on the main thread */
export const DEFAULT_WORKER_THRESHOLD_BYTES = 100 * 1024

export interface ExecuteOptions {
  /** Force execution in worker regardless of payload size */
  forceWorker?: boolean
  /** Estimated byte size of payload if known */
  byteSize?: number
}

interface PendingTask {
  id: string
  operation: WorkerOperation
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}

export class JsonWorkerClient {
  private worker: Worker | null = null
  private pendingTasks = new Map<string, PendingTask>()
  private taskCounter = 0
  private thresholdBytes: number

  constructor(thresholdBytes: number = DEFAULT_WORKER_THRESHOLD_BYTES) {
    this.thresholdBytes = thresholdBytes
  }

  /**
   * Determine if the environment supports Web Workers
   */
  public isWorkerSupported(): boolean {
    return typeof window !== 'undefined' && typeof Worker !== 'undefined'
  }

  /**
   * Lazily initialize or return existing Web Worker instance
   */
  private getOrCreateWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./json.worker.ts', import.meta.url), {
        type: 'module',
      })

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, result, error } = e.data
        const task = this.pendingTasks.get(id)
        if (task) {
          this.pendingTasks.delete(id)
          if (success) {
            task.resolve(result)
          } else {
            task.reject(new Error(error || 'Worker operation failed'))
          }
        }
      }

      this.worker.onerror = (err) => {
        // Worker crashed or threw an unhandled error
        const message =
          err.message || 'Worker thread encountered an unexpected error'
        this.rejectAllPending(new Error(message))
        this.terminate()
      }
    }

    return this.worker
  }

  /**
   * Check if an operation should run in a worker based on payload size
   */
  public shouldUseWorker(sizeBytes?: number): boolean {
    if (!this.isWorkerSupported()) return false
    if (sizeBytes === undefined) return false
    return sizeBytes >= this.thresholdBytes
  }

  /**
   * Execute an operation with automatic routing (direct vs. worker)
   */
  public async execute<Op extends WorkerOperation>(
    operation: Op,
    payload: WorkerPayloadMap[Op],
    options: ExecuteOptions = {}
  ): Promise<WorkerResultMap[Op]> {
    const { forceWorker = false, byteSize } = options

    const shouldRunInWorker =
      forceWorker || (byteSize !== undefined && byteSize >= this.thresholdBytes)

    // Direct synchronous execution path for small documents or non-worker environments
    if (!shouldRunInWorker || !this.isWorkerSupported()) {
      return processWorkerOperation(operation, payload)
    }

    // Web Worker execution path
    const worker = this.getOrCreateWorker()
    const id = `task-${++this.taskCounter}-${Date.now()}`

    return new Promise<WorkerResultMap[Op]>((resolve, reject) => {
      this.pendingTasks.set(id, {
        id,
        operation,
        resolve: resolve as (val: unknown) => void,
        reject,
      })

      const request: WorkerRequest<Op> = {
        id,
        operation,
        payload,
      }

      worker.postMessage(request)
    })
  }

  /**
   * Cancel a specific pending task or all pending tasks by terminating worker
   */
  public cancelCurrentOperation(): void {
    if (this.pendingTasks.size > 0) {
      this.rejectAllPending(new Error('Operation cancelled by user'))
    }
    this.terminate()
  }

  /**
   * Terminate active worker instance and clean up references
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingTasks.clear()
  }

  /**
   * Check if any operations are currently running in the worker
   */
  public isBusy(): boolean {
    return this.pendingTasks.size > 0
  }

  private rejectAllPending(error: Error) {
    for (const [, task] of this.pendingTasks) {
      task.reject(error)
    }
    this.pendingTasks.clear()
  }
}

/** Global singleton instance */
export const workerClient = new JsonWorkerClient()
