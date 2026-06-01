import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TagService } from '../src/TagService.js'
import type { DatabaseAdapter, Tag, TagsTaggable } from '../src/types.js'

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: '1',
    uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    slug: 'vip',
    name: 'VIP',
    deleted_at: null,
    updated_at: new Date(),
    created_at: new Date(),
    ...overrides,
  }
}

function makeTagsTaggable(overrides: Partial<TagsTaggable> = {}): TagsTaggable {
  return {
    id: '10',
    tag_id: '1',
    tagger_id: '5',
    tagger_type: 'users',
    taggable_id: '42',
    taggable_type: 'posts',
    deleted_at: null,
    updated_at: new Date(),
    created_at: new Date(),
    ...overrides,
  }
}

function makeDb(): DatabaseAdapter {
  return {
    listTags: vi.fn().mockResolvedValue([makeTag()]),
    createTag: vi.fn().mockResolvedValue(makeTag()),
    getTag: vi.fn().mockResolvedValue(makeTag()),
    getTagBySlug: vi.fn().mockResolvedValue(makeTag()),
    getTagByUuid: vi.fn().mockResolvedValue(makeTag()),
    updateTag: vi.fn().mockResolvedValue(undefined),
    createTagsTaggable: vi.fn().mockResolvedValue(makeTagsTaggable()),
    getTagsForTaggable: vi.fn().mockResolvedValue([makeTag()]),
    getTagsTaggable: vi.fn().mockResolvedValue(makeTagsTaggable()),
    deleteTagsTaggable: vi.fn().mockResolvedValue(undefined),
  }
}

describe('TagService', () => {
  let db: DatabaseAdapter
  let tm: TagService

  beforeEach(() => {
    db = makeDb()
    tm = new TagService({ db })
  })

  describe('list', () => {
    it('delegates to db.listTags', async () => {
      const tags = await tm.list()

      expect(db.listTags).toHaveBeenCalled()
      expect(tags).toHaveLength(1)
      expect(tags[0].slug).toBe('vip')
    })
  })

  describe('create', () => {
    it('creates a tag with generated uuid', async () => {
      const tag = await tm.create({ slug: 'vip', name: 'VIP' })

      expect(db.createTag).toHaveBeenCalledWith({
        uuid: expect.any(String),
        slug: 'vip',
        name: 'VIP',
      })
      expect(tag.id).toBe('1')
    })
  })

  describe('getBySlug', () => {
    it('delegates to db.getTagBySlug', async () => {
      const tag = await tm.getBySlug('vip')

      expect(db.getTagBySlug).toHaveBeenCalledWith('vip')
      expect(tag!.slug).toBe('vip')
    })
  })

  describe('getByUuid', () => {
    it('delegates to db.getTagByUuid', async () => {
      const tag = await tm.getByUuid('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

      expect(db.getTagByUuid).toHaveBeenCalledWith('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      expect(tag!.uuid).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    })
  })

  describe('update', () => {
    it('updates tag fields', async () => {
      await tm.update('1', { name: 'Premium' })

      expect(db.getTag).toHaveBeenCalledWith('1')
      expect(db.updateTag).toHaveBeenCalledWith('1', { name: 'Premium' })
    })

    it('throws if tag not found', async () => {
      vi.mocked(db.getTag).mockResolvedValue(null)
      await expect(tm.update('999', { name: 'X' }))
        .rejects.toThrow('Tag not found: 999')
    })
  })

  describe('attach', () => {
    it('creates tags_taggables record', async () => {
      const record = await tm.attach('1', { type: 'posts', id: '42' }, { type: 'users', id: '5' })

      expect(db.createTagsTaggable).toHaveBeenCalledWith({
        tag_id: '1',
        taggable_id: '42',
        taggable_type: 'posts',
        tagger_id: '5',
        tagger_type: 'users',
      })
      expect(record.id).toBe('10')
    })

    it('throws if tag not found', async () => {
      vi.mocked(db.getTag).mockResolvedValue(null)
      await expect(tm.attach('999', { type: 'posts', id: '42' }, { type: 'users', id: '5' }))
        .rejects.toThrow('Tag not found: 999')
    })
  })

  describe('detach', () => {
    it('deletes tags_taggables record', async () => {
      await tm.detach('10')

      expect(db.getTagsTaggable).toHaveBeenCalledWith('10')
      expect(db.deleteTagsTaggable).toHaveBeenCalledWith('10')
    })

    it('throws if record not found', async () => {
      vi.mocked(db.getTagsTaggable).mockResolvedValue(null)
      await expect(tm.detach('999'))
        .rejects.toThrow('TagsTaggable not found: 999')
    })
  })

  describe('getTagsFor', () => {
    it('returns tags for a taggable', async () => {
      const tags = await tm.getTagsFor({ type: 'posts', id: '42' })

      expect(db.getTagsForTaggable).toHaveBeenCalledWith({ type: 'posts', id: '42' })
      expect(tags).toHaveLength(1)
      expect(tags[0].slug).toBe('vip')
    })
  })

  describe('softDelete', () => {
    it('sets deleted_at on tag', async () => {
      await tm.softDelete('1')

      expect(db.getTag).toHaveBeenCalledWith('1')
      expect(db.updateTag).toHaveBeenCalledWith('1', { deleted_at: expect.any(Date) })
    })

    it('throws if tag not found', async () => {
      vi.mocked(db.getTag).mockResolvedValue(null)
      await expect(tm.softDelete('999'))
        .rejects.toThrow('Tag not found: 999')
    })
  })
})
