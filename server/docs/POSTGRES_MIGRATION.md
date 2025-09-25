PostgreSQL Migration Plan (PITR-ready)

1) Provision Postgres with WAL archiving and PITR
   - RDS/Aurora or self-managed with:
     wal_level = replica
     archive_mode = on
     archive_command = 'test ! -f /var/lib/postgresql/wal/%f && cp %p /var/lib/postgresql/wal/%f'
     max_wal_senders = 5
   - Enable automated daily snapshots and 7–30d retention.

2) Schema
   - Create tables analogous to SQLite schema.
   - Use UUID primary keys where suitable; keep unique constraints.
   - Add GIN/GIST indexes for search fields.

3) App changes
   - Replace sqlite3 with pg client; add connection pool.
   - Update database.js to abstract driver; introduce a repository layer.

4) Migration
   - Freeze writes, dump SQLite to JSON/CSV.
   - Load into Postgres with COPY.
   - Verify row counts and integrity hashes for ledgers.

5) Cutover
   - Point env DATABASE_URL to Postgres.
   - Smoke test, then re-enable writes.

6) Backups
   - Enable PITR; verify WAL archiving and snapshot restore.


