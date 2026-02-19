#!/usr/bin/env node
import { apiRequest } from './gitlab-thin-client.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const method = args.method || 'GET';
const endpoint = args.endpoint;

let body;
if (args.body) {
  try {
    body = JSON.parse(args.body);
  } catch {
    console.error(JSON.stringify({ ok: false, error: { type: 'validation', message: 'Invalid JSON in --body' } }));
    process.exit(1);
  }
}

if (!endpoint) {
  console.error(JSON.stringify({ ok: false, error: { type: 'validation', message: 'Missing --endpoint' } }));
  process.exit(1);
}

const result = await apiRequest({ method, endpoint, body });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
