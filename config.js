import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-gcp-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Base URL for Google OAuth token exchange
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
