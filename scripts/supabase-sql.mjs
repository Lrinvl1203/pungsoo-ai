#!/usr/bin/env node
// Run SQL against the linked Supabase project through the Management API.
//
// Credentials come from .env.local and are never printed.
//   SUPABASE_ACCESS_TOKEN  personal access token (sbp_...), required
//   SUPABASE_PROJECT_REF   optional; derived from VITE_SUPABASE_URL when absent
//
// Usage:
//   node scripts/supabase-sql.mjs --file supabase/apply/2026-07-30-security-apply.sql
//   node scripts/supabase-sql.mjs --query "select count(*) from public.purchases;"
//   node scripts/supabase-sql.mjs --whoami
//   node scripts/supabase-sql.mjs --file <path> --dry-run

import { readFileSync } from 'node:fs';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env', override: false });

const MANAGEMENT_API = 'https://api.supabase.com';

const parseArgs = (argv) => {
    const args = { file: null, query: null, dryRun: false, whoami: false, json: false };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--file' || arg === '-f') args.file = argv[++i] ?? null;
        else if (arg === '--query' || arg === '-q') args.query = argv[++i] ?? null;
        else if (arg === '--dry-run') args.dryRun = true;
        else if (arg === '--whoami') args.whoami = true;
        else if (arg === '--json') args.json = true;
        else if (!args.file && !args.query && !arg.startsWith('-')) args.file = arg;
    }

    return args;
};

const fail = (message) => {
    console.error(`ERROR: ${message}`);
    process.exit(1);
};

const resolveProjectRef = () => {
    const explicit = process.env.SUPABASE_PROJECT_REF?.trim();
    if (explicit) return explicit;

    const url = process.env.VITE_SUPABASE_URL?.trim();
    if (!url) return null;

    const match = url.match(/^https?:\/\/([a-z0-9]+)\.supabase\.(co|in)/i);
    return match ? match[1] : null;
};

const request = async (path, token, init = {}) => {
    const response = await fetch(`${MANAGEMENT_API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
        },
    });

    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    if (!response.ok) {
        const detail = typeof body === 'string' ? body : JSON.stringify(body);
        fail(`Management API ${response.status} ${response.statusText}\n${detail}`);
    }

    return body;
};

const main = async () => {
    const args = parseArgs(process.argv.slice(2));

    const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
    if (!token) {
        fail(
            'SUPABASE_ACCESS_TOKEN is not set.\n'
            + 'Add it to .env.local. See docs/SUPABASE_ACCESS_SETUP.md.',
        );
    }
    if (!token.startsWith('sbp_')) {
        fail(
            'SUPABASE_ACCESS_TOKEN does not look like a personal access token (expected sbp_ prefix).\n'
            + 'A publishable or secret API key cannot run DDL. See docs/SUPABASE_ACCESS_SETUP.md.',
        );
    }

    const projectRef = resolveProjectRef();
    if (!projectRef) {
        fail('Could not determine the project ref. Set SUPABASE_PROJECT_REF or VITE_SUPABASE_URL in .env.local.');
    }

    if (args.whoami) {
        const projects = await request('/v1/projects', token);
        const match = Array.isArray(projects)
            ? projects.find((project) => project.id === projectRef)
            : null;

        console.log(`token: valid (${Array.isArray(projects) ? projects.length : 0} project(s) visible)`);
        console.log(`target ref: ${projectRef}`);
        console.log(match ? `target name: ${match.name} (${match.region})` : 'target: NOT visible to this token');
        if (!match) process.exitCode = 2;
        return;
    }

    let sql = args.query;
    if (!sql && args.file) sql = readFileSync(args.file, 'utf8');
    if (!sql?.trim()) {
        fail('Nothing to run. Pass --file <path> or --query "<sql>".');
    }

    const statementCount = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((part) => part.trim())
        .filter((part) => part && !part.split('\n').every((line) => line.trim().startsWith('--')))
        .length;

    console.log(`target ref: ${projectRef}`);
    console.log(`source: ${args.file ?? 'inline query'}`);
    console.log(`characters: ${sql.length}, statement groups: ~${statementCount}`);

    if (args.dryRun) {
        console.log('dry run: nothing was sent.');
        return;
    }

    const result = await request(`/v1/projects/${projectRef}/database/query`, token, {
        method: 'POST',
        body: JSON.stringify({ query: sql }),
    });

    console.log('status: OK');

    if (args.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    if (Array.isArray(result) && result.length > 0) {
        console.table(result);
    } else {
        console.log('rows returned: 0');
    }
};

main().catch((error) => fail(error?.message ?? String(error)));
