// --- Domain models (match DB schema) ---

export interface Tag {
  id: string
  uuid: string
  slug: string
  name: string
  deleted_at: Date | null
  updated_at: Date
  created_at: Date
}

export interface TagsTaggable {
  id: string
  tag_id: string
  tagger_id: string
  tagger_type: string
  taggable_id: string
  taggable_type: string
  deleted_at: Date | null
  updated_at: Date
  created_at: Date
}

// --- Input types ---

export interface Taggable {
  type: string
  id: string
}

export interface Tagger {
  type: string
  id: string
}

// --- Adapter interface ---

export interface DatabaseAdapter {
  createTag(data: {
    uuid: string
    slug: string
    name: string
  }): Promise<Tag>

  listTags(): Promise<Tag[]>
  getTag(id: string): Promise<Tag | null>
  getTagBySlug(slug: string): Promise<Tag | null>
  getTagByUuid(uuid: string): Promise<Tag | null>
  updateTag(id: string, data: Partial<Pick<Tag, 'slug' | 'name' | 'deleted_at'>>): Promise<void>

  createTagsTaggable(data: {
    tag_id: string
    tagger_id: string
    tagger_type: string
    taggable_id: string
    taggable_type: string
  }): Promise<TagsTaggable>

  getTagsForTaggable(taggable: Taggable): Promise<Tag[]>
  getTagsTaggable(id: string): Promise<TagsTaggable | null>
  deleteTagsTaggable(id: string): Promise<void>
}
