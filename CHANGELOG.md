# 1.0.0 (2026-06-03)


### Features

* initial release of node-tags ([0f46fc6](https://github.com/blamodex/node-tags/commit/0f46fc645b1dc115a608dcf467e9bc7693fd2891))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-13

### Added

- `TagManager` with create, update, list, soft-delete, attach, and detach operations
- `DrizzleAdapter` for Drizzle ORM (MySQL and SQLite)
- MySQL schema definitions (`@blamodex/node-tags/schema`)
- SQLite schema and `setup()` helper (`@blamodex/node-tags/sqlite`)
- Polymorphic tagging via `taggable_type` / `tagger_type`
- Full TypeScript type exports
