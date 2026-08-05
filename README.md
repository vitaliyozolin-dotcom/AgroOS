# AgroOS on Timeweb Cloud

Production bundle for the AgroOS climate node dashboard and telemetry history.

- Runtime: Node.js 22 + Next.js
- Storage: SQLite in WAL mode on a persistent Docker volume
- Edge: Caddy with automatic HTTPS and Basic Auth for the dashboard
- Device ingest: `POST /api/telemetry` authenticated with `x-agroos-device-key`
- Backups: daily consistent SQLite copies with 14-day local retention

The public device endpoint is separated from the protected dashboard. Never commit `.env`.
