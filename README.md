# @blamodex/node-tags

Polymorphic tagging system for Node.js. Attach tags to any entity type using a pluggable database adapter.

## Features

- Polymorphic tagging: attach tags to any entity type via `taggable_type` / `tagger_type`
- Soft deletes
- UUID-based external identifiers
- Drizzle ORM adapter included (MySQL and SQLite schemas provided)
- Bring your own adapter by implementing the `DatabaseAdapter` interface

## Install

```bash
npm install @blamodex/node-tags
```

If using the included Drizzle adapter:

```bash
npm install drizzle-orm
```

## Quick Start (SQLite)

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { setup } from '@blamodex/node-tags/sqlite'

const sqlite = new Database(':memory:')
const db = drizzle(sqlite)
const tags = setup(db)

// Create a tag
const tag = await tags.create({ slug: 'featured', name: 'Featured' })

// Attach it to an entity
await tags.attach(
  tag.id,
  { type: 'Post', id: '42' },
  { type: 'User', id: '1' },
)

// Get all tags for an entity
const postTags = await tags.getTagsFor({ type: 'Post', id: '42' })
```

## Quick Start (MySQL with Drizzle)

```ts
import { drizzle } from 'drizzle-orm/mysql2'
import { DrizzleAdapter } from '@blamodex/node-tags/drizzle'
import { tags, tagsTaggables } from '@blamodex/node-tags/schema'
import { TagManager } from '@blamodex/node-tags'

const db = drizzle(pool)

const adapter = new DrizzleAdapter({ db, tags, tagsTaggables })
const tagManager = new TagManager({ db: adapter })
```

## API

### `TagManager`

| Method | Description |
|---|---|
| `list()` | List all tags |
| `create({ slug, name })` | Create a tag |
| `getBySlug(slug)` | Find tag by slug |
| `getByUuid(uuid)` | Find tag by UUID |
| `update(tagId, data)` | Update a tag's slug or name |
| `attach(tagId, taggable, tagger)` | Attach a tag to an entity |
| `detach(tagsTaggableId)` | Remove a tag attachment |
| `getTagsFor(taggable)` | Get all tags for an entity |
| `softDelete(tagId)` | Soft-delete a tag |

### Custom Adapters

Implement the `DatabaseAdapter` interface to use any database:

```ts
import type { DatabaseAdapter } from '@blamodex/node-tags'

class MyAdapter implements DatabaseAdapter {
  // Implement all methods from the interface
}

const tagManager = new TagManager({ db: new MyAdapter() })
```

## Exports

| Path | Contents |
|---|---|
| `@blamodex/node-tags` | `TagManager` class and all types |
| `@blamodex/node-tags/drizzle` | `DrizzleAdapter` |
| `@blamodex/node-tags/schema` | MySQL Drizzle schema definitions |
| `@blamodex/node-tags/sqlite` | SQLite schema and `setup()` helper |

## Development

```bash
npm install
npm run build
npm test
npm run lint
```

## License

[MIT](LICENSE)
