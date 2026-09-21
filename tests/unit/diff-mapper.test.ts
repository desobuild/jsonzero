import { describe, it, expect } from 'vitest'
import {
  indexJsonPositions,
  buildDiffHighlights,
  compareJson,
} from '@/lib/json'

describe('Structural Diff Position Mapper (diff-mapper)', () => {
  it('1. Equal JSON produces zero differences and zero highlights', () => {
    const jsonA = JSON.stringify({ name: 'Alice', age: 30 }, null, 2)
    const jsonB = JSON.stringify({ name: 'Alice', age: 30 }, null, 2)

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(0)

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)
    expect(result.highlightsA).toHaveLength(0)
    expect(result.highlightsB).toHaveLength(0)
    expect(Object.keys(result.linesA)).toHaveLength(0)
    expect(Object.keys(result.linesB)).toHaveLength(0)
  })

  it('2. Root-level changed value: maps accurately to the changed value on both sides', () => {
    const jsonA = '{\n  "age": 77\n}'
    const jsonB = '{\n  "age": 73\n}'

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.changed).toBe(1)
    expect(diff.entries[0].path).toBe('$.age')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    // Left side: value 77
    expect(result.highlightsA).toHaveLength(1)
    expect(result.highlightsA[0].kind).toBe('changed')
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toBe('77')
    expect(result.linesA[2]).toBe('changed')

    // Right side: value 73
    expect(result.highlightsB).toHaveLength(1)
    expect(result.highlightsB[0].kind).toBe('changed')
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toBe('73')
    expect(result.linesB[2]).toBe('changed')
  })

  it('3. Added property: highlights added property on right only', () => {
    const jsonA = '{\n  "name": "Ani"\n}'
    const jsonB = '{\n  "name": "Ani",\n  "age": 73\n}'

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.added).toBe(1)
    expect(diff.entries[0].path).toBe('$.age')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(0)
    expect(result.highlightsB).toHaveLength(1)
    expect(result.highlightsB[0].kind).toBe('added')
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toContain('"age": 73')
    expect(result.linesB[3]).toBe('added')
  })

  it('4. Removed property: highlights removed property on left only', () => {
    const jsonA = '{\n  "name": "Ani",\n  "age": 73\n}'
    const jsonB = '{\n  "name": "Ani"\n}'

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.removed).toBe(1)
    expect(diff.entries[0].path).toBe('$.age')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    expect(result.highlightsA[0].kind).toBe('removed')
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toContain('"age": 73')
    expect(result.linesA[3]).toBe('removed')
    expect(result.highlightsB).toHaveLength(0)
  })

  it('5. Nested object: $.user.profile.age highlights only the deep value, not parent object', () => {
    const jsonA = JSON.stringify(
      {
        user: {
          profile: {
            age: 77,
          },
        },
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        user: {
          profile: {
            age: 73,
          },
        },
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(1)
    expect(diff.entries[0].path).toBe('$.user.profile.age')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toBe('77')
    expect(result.highlightsB).toHaveLength(1)
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toBe('73')
  })

  it('6. Array index: $.users[2].age targets the exact array item', () => {
    const jsonA = JSON.stringify(
      {
        users: [{ age: 10 }, { age: 20 }, { age: 30 }, { age: 40 }],
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        users: [{ age: 10 }, { age: 20 }, { age: 99 }, { age: 40 }],
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(1)
    expect(diff.entries[0].path).toBe('$.users[2].age')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toBe('30')

    expect(result.highlightsB).toHaveLength(1)
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toBe('99')
  })

  it('7. Array of objects: multiple objects with only one changed item', () => {
    const jsonA = JSON.stringify(
      [
        { id: 1, label: 'Item 1' },
        { id: 2, label: 'Item 2' },
        { id: 3, label: 'Item 3' },
      ],
      null,
      2
    )

    const jsonB = JSON.stringify(
      [
        { id: 1, label: 'Item 1' },
        { id: 2, label: 'Modified Item 2' },
        { id: 3, label: 'Item 3' },
      ],
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(1)
    expect(diff.entries[0].path).toBe('$[1].label')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toBe('"Item 2"')

    expect(result.highlightsB).toHaveLength(1)
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toBe('"Modified Item 2"')
  })

  it('8. Duplicate values and keys at different structural positions: maps to correct path not first match', () => {
    // Note that "value": "duplicate" appears at $.first.value and $.second.value
    // But ONLY $.second.value changes in B!
    const jsonA = JSON.stringify(
      {
        first: {
          value: 'duplicate',
        },
        second: {
          value: 'duplicate',
        },
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        first: {
          value: 'duplicate',
        },
        second: {
          value: 'unique_changed',
        },
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(1)
    expect(diff.entries[0].path).toBe('$.second.value')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    // Verify the highlight is on $.second.value, NOT $.first.value
    const firstPos = posA.get('$.first.value')!
    const secondPos = posA.get('$.second.value')!
    expect(result.highlightsA[0].start).toBe(secondPos.valueStart)
    expect(result.highlightsA[0].start).not.toBe(firstPos.valueStart)
  })

  it('9. Multiple differences: correctly tracks changed, added, and removed highlights simultaneously', () => {
    const jsonA = JSON.stringify(
      {
        a: 1,
        b: 2,
        removed: true,
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        a: 1,
        b: 99,
        added: 'new',
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.changed).toBe(1)
    expect(diff.summary.added).toBe(1)
    expect(diff.summary.removed).toBe(1)

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    // Left should have 1 changed (b) and 1 removed (removed)
    expect(result.highlightsA).toHaveLength(2)
    expect(result.highlightsA.some((h) => h.kind === 'changed')).toBe(true)
    expect(result.highlightsA.some((h) => h.kind === 'removed')).toBe(true)

    // Right should have 1 changed (b) and 1 added (added)
    expect(result.highlightsB).toHaveLength(2)
    expect(result.highlightsB.some((h) => h.kind === 'changed')).toBe(true)
    expect(result.highlightsB.some((h) => h.kind === 'added')).toBe(true)
  })

  it('10. Filters: toggling category filters selectively controls highlights', () => {
    const jsonA = JSON.stringify(
      {
        changedVal: 1,
        removedVal: 2,
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        changedVal: 100,
        addedVal: 3,
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    // A: Disable changed
    const noChanged = buildDiffHighlights(diff, posA, posB, {
      showChanged: false,
      showAdded: true,
      showRemoved: true,
    })
    expect(noChanged.highlightsA.every((h) => h.kind !== 'changed')).toBe(true)
    expect(noChanged.highlightsB.every((h) => h.kind !== 'changed')).toBe(true)
    expect(noChanged.highlightsA.some((h) => h.kind === 'removed')).toBe(true)
    expect(noChanged.highlightsB.some((h) => h.kind === 'added')).toBe(true)

    // B: Disable added
    const noAdded = buildDiffHighlights(diff, posA, posB, {
      showChanged: true,
      showAdded: false,
      showRemoved: true,
    })
    expect(noAdded.highlightsB.every((h) => h.kind !== 'added')).toBe(true)
    expect(noAdded.highlightsB.some((h) => h.kind === 'changed')).toBe(true)

    // C: Disable removed
    const noRemoved = buildDiffHighlights(diff, posA, posB, {
      showChanged: true,
      showAdded: true,
      showRemoved: false,
    })
    expect(noRemoved.highlightsA.every((h) => h.kind !== 'removed')).toBe(true)
    expect(noRemoved.highlightsA.some((h) => h.kind === 'changed')).toBe(true)
  })

  it('11. Keys containing special characters and spaces match diff engine paths', () => {
    const jsonA = JSON.stringify(
      {
        'user name': 'Ani',
        'user.email': 'ani@old.com',
        'items[0]': true,
      },
      null,
      2
    )

    const jsonB = JSON.stringify(
      {
        'user name': 'Ani',
        'user.email': 'ani@new.com',
        'items[0]': true,
      },
      null,
      2
    )

    const diff = compareJson(JSON.parse(jsonA), JSON.parse(jsonB))
    expect(diff.summary.total).toBe(1)
    expect(diff.entries[0].path).toBe('$["user.email"]')

    const posA = indexJsonPositions(jsonA)
    const posB = indexJsonPositions(jsonB)

    const result = buildDiffHighlights(diff, posA, posB)

    expect(result.highlightsA).toHaveLength(1)
    expect(
      jsonA.slice(result.highlightsA[0].start, result.highlightsA[0].end)
    ).toBe('"ani@old.com"')

    expect(result.highlightsB).toHaveLength(1)
    expect(
      jsonB.slice(result.highlightsB[0].start, result.highlightsB[0].end)
    ).toBe('"ani@new.com"')
  })
})
