import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DrizzleAdapter } from './DrizzleAdapter.js'
import { tags, tagsTaggables } from './schema.js'

function mockTagRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    slug: 'vip',
    name: 'VIP',
    deleted_at: null,
    updated_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
    ...overrides,
  }
}

function mockTagsTaggableRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    tag_id: 1,
    tagger_id: 5,
    tagger_type: 'users',
    taggable_id: 42,
    taggable_type: 'posts',
    deleted_at: null,
    updated_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
    ...overrides,
  }
}

function makeMockDb() {
  const whereResult = { where: vi.fn() }
  const fromResult = { from: vi.fn().mockReturnValue(whereResult) }
  const setResult = { set: vi.fn().mockReturnValue(whereResult) }
  const valuesResult = { values: vi.fn() }

  return {
    db: {
      select: vi.fn().mockReturnValue(fromResult),
      insert: vi.fn().mockReturnValue(valuesResult),
      update: vi.fn().mockReturnValue(setResult),
      delete: vi.fn().mockReturnValue(whereResult),
    } as any,
    whereResult,
    fromResult,
    setResult,
    valuesResult,
  }
}

describe('DrizzleAdapter', () => {
  let mock: ReturnType<typeof makeMockDb>
  let adapter: DrizzleAdapter

  beforeEach(() => {
    mock = makeMockDb()
    adapter = new DrizzleAdapter({ db: mock.db, tags, tagsTaggables })
  })

  describe('createTag', () => {
    it('inserts and returns the tag with string ids', async () => {
      // insert().values() returns the raw result; adapter falls back to getTagByUuid
      mock.valuesResult.values.mockResolvedValue([])
      mock.whereResult.where.mockResolvedValue([mockTagRow()])

      const tag = await adapter.createTag({ uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', slug: 'vip', name: 'VIP' })

      expect(mock.db.insert).toHaveBeenCalled()
      expect(tag.id).toBe('1')
      expect(tag.slug).toBe('vip')
      expect(tag.uuid).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    })

    it('returns directly from returning() result when available', async () => {
      mock.valuesResult.values.mockResolvedValue([mockTagRow({ id: 5 })])

      const tag = await adapter.createTag({ uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', slug: 'vip', name: 'VIP' })

      expect(tag.id).toBe('5')
    })
  })

  describe('getTag', () => {
    it('returns tag when found', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagRow()])

      const tag = await adapter.getTag('1')

      expect(tag).not.toBeNull()
      expect(tag!.id).toBe('1')
    })

    it('returns null when not found', async () => {
      mock.whereResult.where.mockResolvedValue([])

      const tag = await adapter.getTag('999')

      expect(tag).toBeNull()
    })
  })

  describe('getTagBySlug', () => {
    it('returns tag when found', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagRow()])

      const tag = await adapter.getTagBySlug('vip')

      expect(tag).not.toBeNull()
      expect(tag!.slug).toBe('vip')
    })

    it('returns null when not found', async () => {
      mock.whereResult.where.mockResolvedValue([])

      const tag = await adapter.getTagBySlug('missing')

      expect(tag).toBeNull()
    })
  })

  describe('getTagByUuid', () => {
    it('returns tag when found', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagRow()])

      const tag = await adapter.getTagByUuid('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

      expect(tag).not.toBeNull()
      expect(tag!.uuid).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    })

    it('returns null when not found', async () => {
      mock.whereResult.where.mockResolvedValue([])

      const tag = await adapter.getTagByUuid('missing-uuid')

      expect(tag).toBeNull()
    })
  })

  describe('updateTag', () => {
    it('updates name', async () => {
      mock.whereResult.where.mockResolvedValue(undefined)

      await adapter.updateTag('1', { name: 'Premium' })

      expect(mock.db.update).toHaveBeenCalled()
      const call = mock.setResult.set.mock.calls[0][0]
      expect(call.name).toBe('Premium')
      expect(call.updated_at).toBeInstanceOf(Date)
    })

    it('updates slug', async () => {
      mock.whereResult.where.mockResolvedValue(undefined)

      await adapter.updateTag('1', { slug: 'premium' })

      const call = mock.setResult.set.mock.calls[0][0]
      expect(call.slug).toBe('premium')
    })

    it('serializes deleted_at via timestamp', async () => {
      mock.whereResult.where.mockResolvedValue(undefined)
      const now = new Date()

      await adapter.updateTag('1', { deleted_at: now })

      const call = mock.setResult.set.mock.calls[0][0]
      expect(call.deleted_at).toBeInstanceOf(Date)
    })

    it('sets deleted_at to null', async () => {
      mock.whereResult.where.mockResolvedValue(undefined)

      await adapter.updateTag('1', { deleted_at: null })

      const call = mock.setResult.set.mock.calls[0][0]
      expect(call.deleted_at).toBeNull()
    })
  })

  describe('createTagsTaggable', () => {
    it('inserts and returns record with string ids', async () => {
      mock.valuesResult.values.mockResolvedValue(undefined)
      mock.whereResult.where.mockResolvedValue([mockTagsTaggableRow()])

      const record = await adapter.createTagsTaggable({
        tag_id: '1', tagger_id: '5', tagger_type: 'users', taggable_id: '42', taggable_type: 'posts',
      })

      expect(record.id).toBe('10')
      expect(record.tag_id).toBe('1')
      expect(record.taggable_id).toBe('42')
    })
  })

  describe('getTagsTaggable', () => {
    it('returns record when found', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagsTaggableRow()])

      const record = await adapter.getTagsTaggable('10')

      expect(record).not.toBeNull()
      expect(record!.id).toBe('10')
    })

    it('returns null when not found', async () => {
      mock.whereResult.where.mockResolvedValue([])

      const record = await adapter.getTagsTaggable('999')

      expect(record).toBeNull()
    })
  })

  describe('listTags', () => {
    it('returns all non-deleted tags', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagRow(), mockTagRow({ id: 2, slug: 'premium' })])

      const result = await adapter.listTags()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
    })

    it('returns empty array when no tags', async () => {
      mock.whereResult.where.mockResolvedValue([])

      const result = await adapter.listTags()

      expect(result).toEqual([])
    })
  })

  describe('getTagsForTaggable', () => {
    it('returns tags for a taggable entity', async () => {
      mock.whereResult.where
        .mockResolvedValueOnce([mockTagsTaggableRow()])
        .mockResolvedValueOnce([mockTagRow()])

      const result = await adapter.getTagsForTaggable({ type: 'posts', id: '42' })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('returns empty array when no pivot rows', async () => {
      mock.whereResult.where.mockResolvedValueOnce([])

      const result = await adapter.getTagsForTaggable({ type: 'posts', id: '42' })

      expect(result).toEqual([])
    })

    it('skips deleted tags', async () => {
      mock.whereResult.where
        .mockResolvedValueOnce([mockTagsTaggableRow()])
        .mockResolvedValueOnce([])

      const result = await adapter.getTagsForTaggable({ type: 'posts', id: '42' })

      expect(result).toEqual([])
    })
  })

  describe('deleteTagsTaggable', () => {
    it('soft-deletes the record', async () => {
      mock.whereResult.where.mockResolvedValue(undefined)

      await adapter.deleteTagsTaggable('10')

      expect(mock.db.update).toHaveBeenCalled()
      const call = mock.setResult.set.mock.calls[0][0]
      expect(call.deleted_at).toBeDefined()
      expect(call.updated_at).toBeDefined()
    })
  })

  describe('toTag with string timestamps', () => {
    it('converts ISO string timestamps to Date objects', async () => {
      mock.whereResult.where.mockResolvedValue([mockTagRow({
        updated_at: '2026-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        deleted_at: '2026-06-01T00:00:00.000Z',
      })])

      const tag = await adapter.getTag('1')

      expect(tag!.updated_at).toBeInstanceOf(Date)
      expect(tag!.created_at).toBeInstanceOf(Date)
      expect(tag!.deleted_at).toBeInstanceOf(Date)
    })
  })
})
