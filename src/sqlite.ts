import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { DrizzleAdapter } from './DrizzleAdapter.js'
import { TagManager } from './TagManager.js'

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull().unique(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  deleted_at: text('deleted_at'),
  updated_at: text('updated_at').notNull(),
  created_at: text('created_at').notNull(),
})

export const tagsTaggables = sqliteTable('tags_taggables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tag_id: integer('tag_id').notNull(),
  tagger_id: integer('tagger_id').notNull(),
  tagger_type: text('tagger_type').notNull(),
  taggable_id: integer('taggable_id').notNull(),
  taggable_type: text('taggable_type').notNull(),
  deleted_at: text('deleted_at'),
  updated_at: text('updated_at').notNull(),
  created_at: text('created_at').notNull(),
})

const MIGRATE_SQL = `
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    deleted_at TEXT,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tags_taggables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL REFERENCES tags(id),
    tagger_id INTEGER NOT NULL,
    tagger_type TEXT NOT NULL,
    taggable_id INTEGER NOT NULL,
    taggable_type TEXT NOT NULL,
    deleted_at TEXT,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`

type AnyDb = {
  select(): any
  insert(table: any): any
  update(table: any): any
  delete(table: any): any
}

export function setup(db: AnyDb): TagManager {
  const raw = (db as any).$client
  if (raw?.exec) raw.exec(MIGRATE_SQL)

  const adapter = new DrizzleAdapter({
    db,
    tags,
    tagsTaggables,
    timestamp: () => new Date().toISOString(),
  })

  return new TagManager({ db: adapter })
}
