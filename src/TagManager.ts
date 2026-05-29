import { randomUUID } from 'node:crypto'
import type { DatabaseAdapter, Tag, TagsTaggable, Taggable, Tagger } from './types.js'

export class TagManager {
  private db: DatabaseAdapter

  constructor(opts: { db: DatabaseAdapter }) {
    this.db = opts.db
  }

  async list(): Promise<Tag[]> {
    return this.db.listTags()
  }

  async create(data: { slug: string; name: string }): Promise<Tag> {
    return this.db.createTag({
      uuid: randomUUID(),
      slug: data.slug,
      name: data.name,
    })
  }

  async getBySlug(slug: string): Promise<Tag | null> {
    return this.db.getTagBySlug(slug)
  }

  async getByUuid(uuid: string): Promise<Tag | null> {
    return this.db.getTagByUuid(uuid)
  }

  async update(tagId: string, data: Partial<Pick<Tag, 'slug' | 'name'>>): Promise<void> {
    const tag = await this.db.getTag(tagId)
    if (!tag) throw new Error(`Tag not found: ${tagId}`)

    await this.db.updateTag(tagId, data)
  }

  async attach(tagId: string, taggable: Taggable, tagger: Tagger): Promise<TagsTaggable> {
    const tag = await this.db.getTag(tagId)
    if (!tag) throw new Error(`Tag not found: ${tagId}`)

    return this.db.createTagsTaggable({
      tag_id: tagId,
      taggable_id: taggable.id,
      taggable_type: taggable.type,
      tagger_id: tagger.id,
      tagger_type: tagger.type,
    })
  }

  async detach(tagsTaggableId: string): Promise<void> {
    const record = await this.db.getTagsTaggable(tagsTaggableId)
    if (!record) throw new Error(`TagsTaggable not found: ${tagsTaggableId}`)

    await this.db.deleteTagsTaggable(tagsTaggableId)
  }

  async getTagsFor(taggable: Taggable): Promise<Tag[]> {
    return this.db.getTagsForTaggable(taggable)
  }

  async softDelete(tagId: string): Promise<void> {
    const tag = await this.db.getTag(tagId)
    if (!tag) throw new Error(`Tag not found: ${tagId}`)

    await this.db.updateTag(tagId, { deleted_at: new Date() })
  }
}
