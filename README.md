# Google Cloud MCP (`was-gcp-mcp`)

A self-contained, cross-platform Model Context Protocol (MCP) server for Google Cloud Platform (GCP). Exposes 1 master tool (`gcp_api`) allowing AI coding assistants (Claude Desktop, Cursor, Antigravity, VS Code, Zed, etc.) to call **any** Google Cloud API (Compute Engine, Cloud Storage, BigQuery, Vertex AI, Cloud Run, etc.). Built by Web Analytics Solution.

## Prerequisites

| | Required | How to install |
|---|---|---|
| **Node.js 18+** | running `npx` | Mac: `brew install node` · Windows: https://nodejs.org · Linux: `apt install nodejs npm` |
| **Git** | letting `npx` clone from GitHub | Mac: `brew install git` (or first `git --version` triggers Xcode tools) · Windows: https://git-scm.com · Linux: `apt install git` |
| **Google Cloud Project** | to access API data | [Google Cloud Console](https://console.cloud.google.com/) |
| **OAuth Credentials** | for authentication | Walked through below |

## Quick Start — 3 Steps

### Step 1 — Get OAuth Credentials

1. Go to [Google Cloud Console APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** -> **OAuth client ID**.
3. Select **Desktop app** as the Application type.
4. Name it anything (e.g., "MCP Server").
5. Click **Create**. A modal will display your **Client ID** and **Client Secret**. Keep this window open.

### Step 2 — Connect

Run the interactive authentication command in your terminal:

```bash
npx -y github:mnsmasum62786/was-gcp-mcp auth
```

1. Paste your **Client ID** and **Client Secret** when prompted.
2. Your default web browser will open for Google Sign-In.
3. Choose your Google account and click **Allow**. 
4. The CLI will securely save the tokens locally with `0600` permissions at `~/.was-gcp-mcp/config.json`.

### Step 3 — Add to Your AI Client

Add the following configuration to your AI client's MCP configuration JSON file:

```json
{
  "mcpServers": {
    "Google Cloud MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gcp-mcp"]
    }
  }
}
```

#### Configuration File Locations by Client:
- **Claude Desktop (Mac)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows)**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor**: `~/.cursor/mcp.json` (or via Cursor Settings -> MCP)
- **Google Antigravity / Windsurf**: `~/.gemini/antigravity/mcp.json` or `~/.codeium/windsurf/mcp_config.json`

## What You Can Ask the AI

Since this uses a universal tool, you can ask the AI to perform any action on Google Cloud. The AI will look up the correct REST URL and invoke it.

### Example Prompts
- *"List all the compute engine instances in my GCP project `my-project-123`."*
- *"Create a new Cloud Storage bucket called `my-new-bucket-2026`."*
- *"Query the BigQuery dataset `my_dataset` to show the top 10 rows."*
- *"Show me the status of my Cloud Run services in `us-central1`."*
- *"List the billing accounts associated with my Google Cloud profile."*

## All Tools (1 Total)

| Category | Tools | Description |
|---|---|---|
| **Universal API** | `gcp_api` | Invoke any Google Cloud REST API endpoint directly. You provide the full URL, method (GET/POST/PUT/DELETE), query params, and JSON body. |

## CLI Commands

You can run these commands directly via `npx -y github:mnsmasum62786/was-gcp-mcp <command>`:

- `auth` — Interactive prompt to connect or re-connect via Google OAuth.
- `status` — Show config file path and timestamp of saved credentials.
- `logout` — Delete the locally stored credentials file (`~/.was-gcp-mcp/config.json`).
- `help` — Print command line usage and environment variable instructions.

## Multi-Account Setup

Power users can bypass the local config file by setting environment variables. This allows running multiple GCP accounts simultaneously:

```json
{
  "mcpServers": {
    "GCP Work Account": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gcp-mcp"],
      "env": {
        "GCP_CLIENT_ID": "...",
        "GCP_CLIENT_SECRET": "...",
        "GCP_REFRESH_TOKEN": "..."
      }
    }
  }
}
```

## Troubleshooting

### 1. "Google Cloud MCP — not configured yet"
- **Cause**: The server was started without running the authentication setup.
- **Fix**: Open your terminal and run `npx -y github:mnsmasum62786/was-gcp-mcp auth`.

### 2. "Token exchange failed: HTTP 400"
- **Cause**: The OAuth code expired (you took too long to sign in) or your Client Secret was copied incorrectly.
- **Fix**: Run `auth` again and sign in immediately.

### 3. Windows PowerShell Execution Policy Error
If you see an error like `npx.ps1 cannot be loaded because running scripts is disabled`:
- **Fix**: Run the following command in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 4. Old Code / Cached Version after Update
Windows and Mac may cache older npx bundles. To force clear the npx cache and pull the latest release:
- **Windows (PowerShell)**:
  ```powershell
  Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
  npm cache clean --force
  ```
- **Mac / Linux**:
  ```bash
  rm -rf ~/.npm/_npx
  npm cache clean --force
  ```

## License

MIT License. Built by [Web Analytics Solution](https://webanalyticsbd.com/).
