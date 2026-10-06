# Changelog

## 1.0.0 — 2026-10-07

### New Features
- Initial release of `was-gcp-mcp` — shareable Google Cloud Universal MCP server.
- Interactive authentication (`auth` command) supporting Google Cloud OAuth 2.0.
- Local 0600 secret storage in `~/.was-gcp-mcp/config.json`.
- Environment variable overrides (`GCP_CLIENT_ID`, `GCP_CLIENT_SECRET`, `GCP_REFRESH_TOKEN`).
- Master tool `gcp_api` that provides universal access to ANY Google Cloud REST API.
- Full Windows, Mac, and Linux compatibility (using `pathToFileURL` ESM import wrapping).
