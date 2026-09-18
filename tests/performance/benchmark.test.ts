import { describe, it, expect } from 'vitest'
import {
  generateDeepObject,
  generateWideObject,
  generateLargeArray,
  generateHeterogeneousArray,
  generateMixedStructure,
  generateDatasetByScale,
  getUtf8ByteSize,
} from './benchmark-generators'
import {
  runBenchmarkForScale,
  runStructuralBenchmarks,
} from './json-benchmarks'

describe('Performance Benchmark Infrastructure', () => {
  describe('Deterministic Generators', () => {
    it('generates deep objects deterministically', () => {
      const obj1 = generateDeepObject(10)
      const obj2 = generateDeepObject(10)
      expect(JSON.stringify(obj1)).toBe(JSON.stringify(obj2))
      expect((obj1.level as Record<string, unknown>).depth).toBe(1)
    })

    it('generates wide objects with requested key count', () => {
      const wide = generateWideObject(50)
      const keys = Object.keys(wide)
      expect(keys.length).toBe(50)
      expect(keys[0]).toBe('property_00000')
      expect(keys[49]).toBe('property_00049')
    })

    it('generates large arrays deterministically', () => {
      const arr1 = generateLargeArray(20)
      const arr2 = generateLargeArray(20)
      expect(arr1).toHaveLength(20)
      expect(JSON.stringify(arr1)).toBe(JSON.stringify(arr2))
    })

    it('generates heterogeneous arrays with varied field types', () => {
      const het = generateHeterogeneousArray(8)
      expect(het).toHaveLength(8)
      expect(het[0].type).toBe('user')
      expect(het[1].type).toBe('order')
      expect(het[2].type).toBe('log')
      expect(het[3].type).toBe('setting')
    })

    it('generates mixed structures with nested hierarchy', () => {
      const mixed = generateMixedStructure(5)
      expect(mixed.branches).toHaveLength(5)
      expect(mixed.branches[0].items).toHaveLength(10)
      expect(mixed.branches[0].nested).toBeDefined()
    })

    it('generates datasets matching representative byte orders of magnitude', () => {
      const small = generateDatasetByScale('small')
      const smallSize = getUtf8ByteSize(small)
      expect(smallSize).toBeGreaterThan(800) // ~1 KB
      expect(smallSize).toBeLessThan(3000)

      const medium = generateDatasetByScale('medium')
      const medSize = getUtf8ByteSize(medium)
      expect(medSize).toBeGreaterThan(80000) // ~100 KB
      expect(medSize).toBeLessThan(150000)

      const large = generateDatasetByScale('large')
      const largeSize = getUtf8ByteSize(large)
      expect(largeSize).toBeGreaterThan(900000) // ~1 MB
      expect(largeSize).toBeLessThan(1500000)

      const veryLarge = generateDatasetByScale('veryLarge')
      const veryLargeSize = getUtf8ByteSize(veryLarge)
      expect(veryLargeSize).toBeGreaterThan(4500000) // ~5 MB
      expect(veryLargeSize).toBeLessThan(7000000)

      const stress = generateDatasetByScale('stress')
      const stressSize = getUtf8ByteSize(stress)
      expect(stressSize).toBeGreaterThan(9500000) // ~10 MB
      expect(stressSize).toBeLessThan(14000000)
    })
  })

  describe('Pure Engine Benchmarks Execution', () => {
    it('executes small dataset benchmark suite reliably', () => {
      const results = runBenchmarkForScale('small')
      expect(results.length).toBeGreaterThanOrEqual(8)
      for (const res of results) {
        expect(res.success).toBe(true)
        expect(res.elapsedMs).toBeGreaterThanOrEqual(0)
      }
    })

    it('executes medium dataset benchmark suite reliably', () => {
      const results = runBenchmarkForScale('medium')
      expect(results.length).toBeGreaterThanOrEqual(8)
      for (const res of results) {
        expect(res.success).toBe(true)
        expect(res.elapsedMs).toBeGreaterThanOrEqual(0)
      }
    })

    it('executes large dataset benchmark suite reliably', () => {
      const results = runBenchmarkForScale('large')
      expect(results.length).toBeGreaterThanOrEqual(5)
      for (const res of results) {
        expect(res.success).toBe(true)
        expect(res.elapsedMs).toBeGreaterThanOrEqual(0)
      }
    })

    it('executes structural benchmarks on deep, wide and mixed data', () => {
      const structural = runStructuralBenchmarks()
      expect(structural).toHaveLength(3)
      for (const res of structural) {
        expect(res.success).toBe(true)
        expect(res.elapsedMs).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
