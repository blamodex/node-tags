import { describe, it, expect, vi } from 'vitest'
import { setup } from '../src/schema/sqlite.js'
import { TagService } from '../src/TagService.js'

function makeMockDb(opts: { hasExec?: boolean } = {}) {
  const whereResult = { where: vi.fn().mockResolvedValue([]) }
  const fromResult = { from: vi.fn().mockReturnValue(whereResult) }
  const setResult = { set: vi.fn().mockReturnValue(whereResult) }
  const valuesResult = { values: vi.fn().mockResolvedValue([]) }

  const db = {
    select: vi.fn().mockReturnValue(fromResult),
    insert: vi.fn().mockReturnValue(valuesResult),
    update: vi.fn().mockReturnValue(setResult),
    delete: vi.fn().mockReturnValue(whereResult),
    $client: opts.hasExec ? { exec: vi.fn() } : undefined,
  } as any

  return { db, whereResult, fromResult, valuesResult }
}

describe('sqlite setup', () => {
  it('returns a TagService instance', () => {
    const { db } = makeMockDb()

    const result = setup(db)

    expect(result).toBeInstanceOf(TagService)
  })

  it('runs migrations when $client.exec is available', () => {
    const { db } = makeMockDb({ hasExec: true })

    setup(db)

    expect(db.$client.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tags'))
  })

  it('skips migrations when $client has no exec', () => {
    const { db } = makeMockDb({ hasExec: false })

    expect(() => setup(db)).not.toThrow()
  })
})
