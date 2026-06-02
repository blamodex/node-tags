import { eq, and, inArray, isNull } from 'drizzle-orm'
import type { Column, SQL } from 'drizzle-orm'
import type { DatabaseAdapter, Tag, TagsTaggable, Taggable } from '../types.js'

export type DrizzleRow = Record<string, unknown>

interface DrizzleSelectResult {
  where(condition: SQL | undefined): PromiseLike<DrizzleRow[]>
}

export interface DrizzleDb {
  select(): { from(source: object): DrizzleSelectResult }
  insert(table: object): { values(data: Record<string, unknown>): PromiseLike<DrizzleRow[]> }
  update(table: object): { set(values: Record<string, unknown>): DrizzleSelectResult }
  delete(table: object): DrizzleSelectResult
}

export interface TagsTableRef {
  id: Column
  uuid: Column
  slug: Column
  name: Column
  deleted_at: Column
  updated_at: Column
  created_at: Column
}

export interface TagsTaggablesTableRef {
  id: Column
  tag_id: Column
  tagger_id: Column
  tagger_type: Column
  taggable_id: Column
  taggable_type: Column
  deleted_at: Column
  updated_at: Column
  created_at: Column
}

export interface DrizzleAdapterConfig {
  db: DrizzleDb
  tags: TagsTableRef
  tagsTaggables: TagsTaggablesTableRef
  /** Return the value to use for timestamp columns. Defaults to `new Date()`. Use `() => new Date().toISOString()` for SQLite text columns. */
  timestamp?: () => Date | string
}

export class DrizzleAdapter implements DatabaseAdapter {
  private db: DrizzleDb
  private tags: TagsTableRef
  private tagsTaggables: TagsTaggablesTableRef
  private timestamp: () => Date | string

  constructor(config: DrizzleAdapterConfig) {
    this.db = config.db
    this.tags = config.tags
    this.tagsTaggables = config.tagsTaggables
    this.timestamp = config.timestamp ?? (() => new Date())
  }

  async createTag(data: { uuid: string; slug: string; name: string }): Promise<Tag> {
    const now = this.timestamp()
    const result = await this.db.insert(this.tags).values({
      uuid: data.uuid,
      slug: data.slug,
      name: data.name,
      updated_at: now,
      created_at: now,
    })

    // Try .returning() result first (SQLite/Postgres), fall back to $returningId (MySQL)
    if (Array.isArray(result) && result.length && result[0].id !== undefined) {
      return this.toTag(result[0])
    }

    // For MySQL-style or when returning() isn't chained, fetch by uuid
    const tag = await this.getTagByUuid(data.uuid)
    if (!tag) throw new Error(`Failed to retrieve created tag: ${data.uuid}`)
    return tag
  }

  async listTags(): Promise<Tag[]> {
    const rows = await this.db.select().from(this.tags).where(isNull(this.tags.deleted_at))
    return rows.map((row) => this.toTag(row))
  }

  async getTag(id: string): Promise<Tag | null> {
    const rows = await this.db.select().from(this.tags).where(and(eq(this.tags.id, this.coerceId(id)), isNull(this.tags.deleted_at)))
    if (!rows.length) return null
    return this.toTag(rows[0])
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    const rows = await this.db.select().from(this.tags).where(and(eq(this.tags.slug, slug), isNull(this.tags.deleted_at)))
    if (!rows.length) return null
    return this.toTag(rows[0])
  }

  async getTagByUuid(uuid: string): Promise<Tag | null> {
    const rows = await this.db.select().from(this.tags).where(and(eq(this.tags.uuid, uuid), isNull(this.tags.deleted_at)))
    if (!rows.length) return null
    return this.toTag(rows[0])
  }

  async updateTag(id: string, data: Partial<Pick<Tag, 'slug' | 'name' | 'deleted_at'>>): Promise<void> {
    const values: Record<string, unknown> = { updated_at: this.timestamp() }
    if (data.slug !== undefined) values.slug = data.slug
    if (data.name !== undefined) values.name = data.name
    if (data.deleted_at !== undefined) values.deleted_at = data.deleted_at ? this.timestamp() : null

    await this.db.update(this.tags).set(values).where(eq(this.tags.id, this.coerceId(id)))
  }

  async createTagsTaggable(data: {
    tag_id: string
    tagger_id: string
    tagger_type: string
    taggable_id: string
    taggable_type: string
  }): Promise<TagsTaggable> {
    const now = this.timestamp()
    await this.db.insert(this.tagsTaggables).values({
      tag_id: this.coerceId(data.tag_id),
      tagger_id: this.coerceId(data.tagger_id),
      tagger_type: data.tagger_type,
      taggable_id: this.coerceId(data.taggable_id),
      taggable_type: data.taggable_type,
      updated_at: now,
      created_at: now,
    })

    // Fetch back the most recent record matching these values
    const rows = await this.db.select()
      .from(this.tagsTaggables)
      .where(and(
        eq(this.tagsTaggables.tag_id, this.coerceId(data.tag_id)),
        eq(this.tagsTaggables.tagger_id, this.coerceId(data.tagger_id)),
        eq(this.tagsTaggables.tagger_type, data.tagger_type),
        eq(this.tagsTaggables.taggable_id, this.coerceId(data.taggable_id)),
        eq(this.tagsTaggables.taggable_type, data.taggable_type),
        isNull(this.tagsTaggables.deleted_at),
      ))

    if (!rows.length) throw new Error('Failed to retrieve created tags_taggable record')
    return this.toTagsTaggable(rows[rows.length - 1])
  }

  async getTagsForTaggable(taggable: Taggable): Promise<Tag[]> {
    const pivotRows = await this.db.select()
      .from(this.tagsTaggables)
      .where(and(
        eq(this.tagsTaggables.taggable_type, taggable.type),
        eq(this.tagsTaggables.taggable_id, this.coerceId(taggable.id)),
        isNull(this.tagsTaggables.deleted_at),
      ))

    if (!pivotRows.length) return []

    const tagIds = pivotRows.map((r) => r.tag_id as number | string)
    const tagRows = await this.db.select()
      .from(this.tags)
      .where(and(inArray(this.tags.id, tagIds), isNull(this.tags.deleted_at)))

    return tagRows.map((row) => this.toTag(row))
  }

  async getTagsTaggable(id: string): Promise<TagsTaggable | null> {
    const rows = await this.db.select().from(this.tagsTaggables).where(and(eq(this.tagsTaggables.id, this.coerceId(id)), isNull(this.tagsTaggables.deleted_at)))
    if (!rows.length) return null
    return this.toTagsTaggable(rows[0])
  }

  async deleteTagsTaggable(id: string): Promise<void> {
    await this.db.update(this.tagsTaggables)
      .set({ deleted_at: this.timestamp(), updated_at: this.timestamp() })
      .where(eq(this.tagsTaggables.id, this.coerceId(id)))
  }

  private coerceId(id: string): number | string {
    const n = Number(id)
    return Number.isFinite(n) ? n : id
  }

  private toTag(row: DrizzleRow): Tag {
    return {
      id: String(row.id),
      uuid: row.uuid as string,
      slug: row.slug as string,
      name: row.name as string,
      deleted_at: row.deleted_at instanceof Date ? row.deleted_at : row.deleted_at ? new Date(row.deleted_at as string) : null,
      updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at as string),
      created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
    }
  }

  private toTagsTaggable(row: DrizzleRow): TagsTaggable {
    return {
      id: String(row.id),
      tag_id: String(row.tag_id),
      tagger_id: String(row.tagger_id),
      tagger_type: row.tagger_type as string,
      taggable_id: String(row.taggable_id),
      taggable_type: row.taggable_type as string,
      deleted_at: row.deleted_at instanceof Date ? row.deleted_at : row.deleted_at ? new Date(row.deleted_at as string) : null,
      updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at as string),
      created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
    }
  }
}
