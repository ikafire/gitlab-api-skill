import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_TIMEOUT_MS = 15000;

export function normalizeError(status, payload, requestId, fallbackMessage = 'GitLab request failed') {
  let type = 'unknown';
  if (status === 401 || status === 403) type = 'auth';
  else if (status === 404) type = 'not_found';
  else if (status === 429) type = 'rate_limit';
  else if (status >= 400 && status < 500) type = 'validation';
  else if (status >= 500) type = 'network';

  const message =
    (payload && (payload.message || payload.error_description || payload.error)) || fallbackMessage;

  return {
    ok: false,
    error: {
      type,
      status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      request_id: requestId || null
    }
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function execFileAsync(cmd, args, options) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function curlRequest({ method, url, body, token, timeoutMs }) {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const headerPath = join(tmpdir(), `gitlab-headers-${nonce}.txt`);
  const bodyPath = join(tmpdir(), `gitlab-body-${nonce}.txt`);

  const args = [
    '-sS',
    '-X',
    method,
    '-H',
    'Content-Type: application/json',
    '-H',
    `PRIVATE-TOKEN: ${token}`,
    '-D',
    headerPath,
    '-o',
    bodyPath,
    '--max-time',
    String(Math.max(1, Math.floor(timeoutMs / 1000))),
    '-w',
    '%{http_code}',
    url
  ];

  if (body) {
    args.splice(args.length - 3, 0, '--data', JSON.stringify(body));
  }

  try {
    const { stdout } = await execFileAsync('curl', args, {});
    const headersText = await readFile(headerPath, 'utf8');
    const responseText = await readFile(bodyPath, 'utf8');

    const status = Number(stdout.trim()) || 0;
    const requestIdMatch = headersText.match(/^x-request-id:\s*(.+)$/im);

    return {
      ok: status >= 200 && status < 300,
      status,
      payload: parseJson(responseText),
      requestId: requestIdMatch ? requestIdMatch[1].trim() : null
    };
  } finally {
    await Promise.all([rm(headerPath, { force: true }), rm(bodyPath, { force: true })]);
  }
}

export async function apiRequest({
  method = 'GET',
  endpoint,
  body,
  baseUrl = process.env.GITLAB_BASE_URL,
  token = process.env.GITLAB_TOKEN,
  apiVersion = process.env.GITLAB_API_VERSION || 'v4',
  retries = 2,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
  transport = process.env.GITLAB_HTTP_TRANSPORT || 'fetch'
}) {
  if (!token) {
    return {
      ok: false,
      error: {
        type: 'auth',
        status: 401,
        message: 'Missing GITLAB_TOKEN',
        request_id: null
      }
    };
  }

  const url = `${baseUrl}/api/${apiVersion}${endpoint}`;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      let response;
      let payload;
      let requestId;

      if (transport === 'curl') {
        const curlResult = await curlRequest({ method, url, body, token, timeoutMs });
        response = { ok: curlResult.ok, status: curlResult.status };
        payload = curlResult.payload;
        requestId = curlResult.requestId;
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const fetchResponse = await fetchImpl(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
        clearTimeout(timeout);

        requestId = fetchResponse.headers.get('x-request-id');
        const text = await fetchResponse.text();
        payload = parseJson(text);
        response = { ok: fetchResponse.ok, status: fetchResponse.status };
      }

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data: payload,
          request_id: requestId || null
        };
      }

      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        attempt += 1;
        await sleep(Math.min(200 * 2 ** attempt, 1200));
        continue;
      }

      return normalizeError(response.status, payload, requestId);
    } catch (error) {
      if (attempt < retries) {
        attempt += 1;
        await sleep(Math.min(200 * 2 ** attempt, 1200));
        continue;
      }

      return {
        ok: false,
        error: {
          type: 'network',
          status: 0,
          message: error.message,
          request_id: null
        }
      };
    }
  }

  return {
    ok: false,
    error: {
      type: 'unknown',
      status: 0,
      message: 'Unexpected retry termination',
      request_id: null
    }
  };
}

export async function paginatedRequest({
  endpoint,
  perPage = Number(process.env.GITLAB_PER_PAGE || 50),
  maxPages = Number(process.env.GITLAB_MAX_PAGES || 3),
  requestFn = apiRequest
}) {
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const pagedEndpoint = `${endpoint}${separator}page=${page}&per_page=${perPage}`;

    const result = await requestFn({ endpoint: pagedEndpoint });
    if (!result.ok) return result;

    const pageItems = Array.isArray(result.data) ? result.data : [];
    items.push(...pageItems);

    if (pageItems.length < perPage) {
      return {
        ok: true,
        status: 200,
        data: items,
        page_count: page
      };
    }
  }

  return {
    ok: true,
    status: 200,
    data: items,
    page_count: maxPages
  };
}
