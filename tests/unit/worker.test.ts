import { describe, it, expect } from 'vitest'
import { processWorkerOperation } from '@/workers/json.worker'
import {
  JsonWorkerClient,
  DEFAULT_WORKER_THRESHOLD_BYTES,
} from '@/workers/workerClient'

describe('Web Worker Architecture Suite', () => {
  const sampleJson = JSON.stringify({
    name: 'JSONZero',
    version: 1,
    tags: ['privacy', 'fast'],
    meta: { active: true },
  })

  describe('processWorkerOperation Dispatcher', () => {
    it('formats JSON accurately', () => {
      const result = processWorkerOperation('format', {
        json: sampleJson,
        indent: '2',
      })
      expect(result.success).toBe(true)
      expect(result.formatted).toContain('  "name": "JSONZero"')
    })

    it('minifies JSON accurately', () => {
      const result = processWorkerOperation('minify', { json: sampleJson })
      expect(result.success).toBe(true)
      expect(result.minified).not.toContain('\n')
      expect(result.minified).toContain('"name":"JSONZero"')
    })

    it('validates valid JSON accurately', () => {
      const result = processWorkerOperation('validate', { json: sampleJson })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates invalid JSON and returns error details', () => {
      const result = processWorkerOperation('validate', {
        json: '{"invalid": }',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('computes recursive structural statistics', () => {
      const stats = processWorkerOperation('statistics', { json: sampleJson })
      expect(stats.characterCount).toBeGreaterThan(0)
      expect(stats.keyCount).toBe(5)
    })

    it('compares JSON documents in diff operation', () => {
      const modified = JSON.stringify({
        name: 'JSONZero-Updated',
        version: 2,
        tags: ['privacy'],
      })
      const result = processWorkerOperation('diff', {
        jsonA: sampleJson,
        jsonB: modified,
      })
      expect(result.entries.length).toBeGreaterThan(0)
      expect(result.summary.isIdentical).toBe(false)
    })

    it('sorts JSON keys recursively', () => {
      const unsorted = JSON.stringify({ z: 1, a: 2, m: { y: 10, b: 20 } })
      const result = processWorkerOperation('sort', {
        json: unsorted,
        recursive: true,
      })
      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.sorted!)
      expect(Object.keys(parsed)).toEqual(['a', 'm', 'z'])
      expect(Object.keys(parsed.m)).toEqual(['b', 'y'])
    })

    it('flattens and unflattens JSON round trip', () => {
      const flatRes = processWorkerOperation('flatten', { json: sampleJson })
      expect(flatRes.success).toBe(true)
      const unflatRes = processWorkerOperation('unflatten', {
        json: flatRes.flattened!,
      })
      expect(unflatRes.success).toBe(true)
      expect(JSON.parse(unflatRes.unflattened!)).toEqual(JSON.parse(sampleJson))
    })

    it('evaluates JSONPath query', () => {
      const result = processWorkerOperation('jsonpath', {
        json: sampleJson,
        query: '$.tags[0]',
      })
      expect(result.success).toBe(true)
      expect(result.results[0].value).toBe('privacy')
    })

    it('generates test assertions', () => {
      const result = processWorkerOperation('assertions', {
        json: sampleJson,
        options: { style: 'playwright' },
      })
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.code).toContain('expect(')
    })

    it('validates schema compliance', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          version: { type: 'number' },
        },
        required: ['name'],
      }
      const result = processWorkerOperation('schema-validate', {
        data: JSON.parse(sampleJson),
        schema,
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('JsonWorkerClient Routing and Management', () => {
    it('uses synchronous path when below threshold', async () => {
      const client = new JsonWorkerClient(DEFAULT_WORKER_THRESHOLD_BYTES)
      const result = await client.execute(
        'format',
        { json: sampleJson, indent: '2' },
        { byteSize: 200 }
      )
      expect(result.success).toBe(true)
      expect(client.isBusy()).toBe(false)
    })

    it('supports cancellation without unhandled promise rejection', () => {
      const client = new JsonWorkerClient(100)
      client.cancelCurrentOperation()
      expect(client.isBusy()).toBe(false)
    })

    it('supports termination and cleans up cleanly', () => {
      const client = new JsonWorkerClient()
      client.terminate()
      expect(client.isBusy()).toBe(false)
    })
  })
})
