/**
 * JSONZero — Pure JSON Processing Benchmark Suite
 *
 * Measures raw execution time and throughput for core operations without DOM/UI overhead:
 * - Parsing
 * - Formatting / Stringifying
 * - Minifying
 * - Structural Diff
 * - Recursive Statistics
 * - JSONPath Evaluation
 * - Sort Keys
 * - Flatten
 * - Unflatten
 * - Assertion Generation
 */

import {
  formatJSON,
  minifyJSON,
  validateJSON,
  computeJsonStats,
  evaluateJsonPath,
} from '@/lib/json'
import { generateAssertions } from '@/lib/json/assertions'
import { compareJson } from '@/lib/json/diff'
import { sortKeys } from '@/lib/json/sort'
import { flattenJson, unflattenJson } from '@/lib/json/flatten'
import {
  generateDatasetByScale,
  generateDeepObject,
  generateWideObject,
  generateMixedStructure,
  type BenchmarkScale,
  getUtf8ByteSize,
} from './benchmark-generators'

export interface BenchmarkResult {
  operation: string
  scale: string
  dataSizeBytes: number
  elapsedMs: number
  throughputMBs: number
  success: boolean
}

export function measureOperation<T>(fn: () => T): {
  result: T
  elapsedMs: number
} {
  const start = performance.now()
  const result = fn()
  const elapsedMs = performance.now() - start
  return { result, elapsedMs }
}

export function runBenchmarkForScale(scale: BenchmarkScale): BenchmarkResult[] {
  const jsonStr = generateDatasetByScale(scale)
  const sizeBytes = getUtf8ByteSize(jsonStr)
  const sizeMB = sizeBytes / (1024 * 1024)
  const results: BenchmarkResult[] = []

  const record = (name: string, elapsedMs: number, success: boolean = true) => {
    const throughputMBs = elapsedMs > 0 ? sizeMB / (elapsedMs / 1000) : 0
    results.push({
      operation: name,
      scale,
      dataSizeBytes: sizeBytes,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      throughputMBs: Number(throughputMBs.toFixed(2)),
      success,
    })
  }

  // 1. Parse & Validate
  {
    const { result, elapsedMs } = measureOperation(() => validateJSON(jsonStr))
    record('validateJSON', elapsedMs, result.valid)
  }

  // 2. Format
  {
    const { result, elapsedMs } = measureOperation(() =>
      formatJSON(jsonStr, '2')
    )
    record('formatJSON', elapsedMs, result.success)
  }

  // 3. Minify
  {
    const { result, elapsedMs } = measureOperation(() => minifyJSON(jsonStr))
    record('minifyJSON', elapsedMs, result.success)
  }

  // 4. Recursive Statistics
  {
    const { result, elapsedMs } = measureOperation(() =>
      computeJsonStats(jsonStr)
    )
    record('computeJsonStats', elapsedMs, result.characterCount > 0)
  }

  // 5. Structural Diff (compare with modified clone)
  if (scale === 'small' || scale === 'medium' || scale === 'large') {
    const parsed = JSON.parse(jsonStr)
    const modified = Array.isArray(parsed) ? [...parsed] : { ...parsed }
    if (Array.isArray(modified) && modified.length > 0) {
      modified[0] = { ...modified[0], _modified: true }
    }
    const { result, elapsedMs } = measureOperation(() =>
      compareJson(parsed, modified)
    )
    record('compareJson', elapsedMs, result.entries.length >= 0)
  }

  // 6. JSONPath Evaluation
  {
    const { result, elapsedMs } = measureOperation(() =>
      evaluateJsonPath(jsonStr, '$[0].name')
    )
    record('evaluateJsonPath', elapsedMs, result.success)
  }

  // 7. Sort Keys
  {
    const parsed = JSON.parse(jsonStr)
    const { result, elapsedMs } = measureOperation(() =>
      sortKeys(parsed, { recursive: true })
    )
    record('sortKeys', elapsedMs, result !== null)
  }

  // 8. Flatten (on small & medium scales to avoid extreme memory overhead)
  if (scale === 'small' || scale === 'medium') {
    const parsed = JSON.parse(jsonStr)
    const { result, elapsedMs } = measureOperation(() => flattenJson(parsed))
    record('flattenJson', elapsedMs, result !== null)

    if (result) {
      const { result: unflatRes, elapsedMs: unflatMs } = measureOperation(() =>
        unflattenJson(result)
      )
      record('unflattenJson', unflatMs, unflatRes.success)
    }
  }

  // 9. Assertion Generation
  if (scale === 'small' || scale === 'medium') {
    const parsed = JSON.parse(jsonStr)
    const { result, elapsedMs } = measureOperation(() =>
      generateAssertions(parsed, {
        style: 'playwright',
        responseVariable: 'response',
        includeTypes: true,
      })
    )
    record('generateAssertions', elapsedMs, result.items.length > 0)
  }

  return results
}

/**
 * Specialized structural benchmarks for deep and wide objects
 */
export function runStructuralBenchmarks(): BenchmarkResult[] {
  const results: BenchmarkResult[] = []

  // Deep object: depth 100
  const deepObj = generateDeepObject(100)
  const deepJson = JSON.stringify(deepObj)
  const deepSize = getUtf8ByteSize(deepJson)

  {
    const { result, elapsedMs } = measureOperation(() =>
      formatJSON(deepJson, '2')
    )
    results.push({
      operation: 'formatJSON (deep-100)',
      scale: 'structural-deep',
      dataSizeBytes: deepSize,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      throughputMBs: 0,
      success: result.success,
    })
  }

  // Wide object: 1,000 keys
  const wideObj = generateWideObject(1000)
  const wideJson = JSON.stringify(wideObj)
  const wideSize = getUtf8ByteSize(wideJson)

  {
    const { result, elapsedMs } = measureOperation(() =>
      sortKeys(wideObj, { recursive: true })
    )
    results.push({
      operation: 'sortKeys (wide-1000)',
      scale: 'structural-wide',
      dataSizeBytes: wideSize,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      throughputMBs: 0,
      success: result !== null,
    })
  }

  // Mixed structure
  const mixed = generateMixedStructure(25)
  const mixedJson = JSON.stringify(mixed)
  const mixedSize = getUtf8ByteSize(mixedJson)

  {
    const { result, elapsedMs } = measureOperation(() =>
      computeJsonStats(mixedJson)
    )
    results.push({
      operation: 'computeJsonStats (mixed)',
      scale: 'structural-mixed',
      dataSizeBytes: mixedSize,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      throughputMBs: 0,
      success: result.characterCount > 0,
    })
  }

  return results
}
