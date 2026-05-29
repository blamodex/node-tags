import { bigint, index, mysqlTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

export const tags = mysqlTable('tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  uuid: varchar('uuid', { length: 36 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  deleted_at: timestamp('deleted_at'),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('tags_uuid_idx').on(t.uuid),
  uniqueIndex('tags_slug_idx').on(t.slug),
  index('tags_deleted_at_idx').on(t.deleted_at),
])

export const tagsTaggables = mysqlTable('tags_taggables', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  tag_id: bigint('tag_id', { mode: 'number' }).notNull(),
  tagger_id: bigint('tagger_id', { mode: 'number' }).notNull(),
  tagger_type: varchar('tagger_type', { length: 255 }).notNull(),
  taggable_id: bigint('taggable_id', { mode: 'number' }).notNull(),
  taggable_type: varchar('taggable_type', { length: 255 }).notNull(),
  deleted_at: timestamp('deleted_at'),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('tags_taggables_tag_id_idx').on(t.tag_id),
  index('tags_taggables_tagger_type_tagger_id_idx').on(t.tagger_type, t.tagger_id),
  index('tags_taggables_taggable_type_taggable_id_idx').on(t.taggable_type, t.taggable_id),
  index('tags_taggables_deleted_at_idx').on(t.deleted_at),
])
