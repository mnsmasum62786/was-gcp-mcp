#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, TOKEN_URL } from './config.js';

let saved = {};
try { saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch {}
const CLIENT_ID = process.env.GCP_CLIENT_ID || saved.client_id;
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || saved.client_secret;
const REFRESH_TOKEN = process.env.GCP_REFRESH_TOKEN || saved.refresh_token;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    'Google Cloud MCP — not configured yet.\n\n' +
    'Run:  npx -y github:mnsmasum62786/was-gcp-mcp auth\n'
  );
  process.exit(1);
}

// In-memory access token cache
let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh token: HTTP ${res.status} ${await res.text()}`);
  }

  const tokens = await res.json();
  accessToken = tokens.access_token;
  // Expire 1 minute before actual expiration to be safe
  tokenExpiresAt = Date.now() + (tokens.expires_in - 60) * 1000;
  
  return accessToken;
}

// HTTP client helper
async function api(method, urlStr, body, queryParams) {
  const url = new URL(urlStr);
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const token = await getAccessToken();
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }

  if (!res.ok || (parsed && parsed.error)) {
    const errMsg = parsed?.error?.message || parsed?.message || `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

// Universal response wrapper — enforces 60 KB max
function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return {
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your query or use pagination]`,
      }],
    };
  }
  return { content: [{ type: 'text', text }] };
}

// Universal error wrapper
function asError(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Google Cloud API error:\n' + JSON.stringify({
        message: err?.message || String(err),
        status: err?.status ?? null,
        vendor_error: err?.body?.error ?? null,
        raw: err?.body ?? null,
      }, null, 2),
    }],
  };
}

const tools = [
  {
    name: 'gcp_api',
    description: 'Universal escape hatch: invoke any Google Cloud REST API endpoint directly. You MUST provide the full URL (e.g. https://compute.googleapis.com/compute/v1/projects/{project}/zones/{zone}/instances).',
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
        url: { type: 'string', description: 'Full Google Cloud API URL (e.g. https://storage.googleapis.com/storage/v1/b)' },
        params: { type: 'object', description: 'Query string parameters' },
        body: { type: 'object', description: 'JSON request body for POST/PUT/PATCH' },
      },
      required: ['url'],
    },
  }
];

async function handleCall(name, args) {
  if (name === 'gcp_api') {
    return asTextResult(await api(args.method || 'GET', args.url, args.body, args.params));
  }
  throw new Error(`Unknown tool: ${name}`);
}

const server = new Server(
  { name: 'was-gcp-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try { return await handleCall(req.params.name, req.params.arguments || {}); }
  catch (err) { return asError(err); }
});

await server.connect(new StdioServerTransport());
console.error(`was-gcp-mcp v1.0.0 ready — universal GCP tool loaded`);
