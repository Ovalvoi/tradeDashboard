/**
 * UN Comtrade proxy for the Trade Dashboard (GitHub Pages).
 *
 * GET /trade?reporterCode=376&partnerCode=31&period=2020,2021&cmdCode=TOTAL
 *   -> { data: [{ period, flowCode, primaryValue }], source: "api" | "public" }
 *
 * - Keeps the Comtrade subscription key server-side (secrets COMTRADE_KEY / COMTRADE_KEY_2).
 * - Adds CORS for the dashboard's origins only.
 * - Caches results at the edge for a day (annual data changes rarely).
 * - Falls back to the keyless public preview endpoint (one year per call, rate-limited,
 *   so slower) when no key is configured or the key is rejected.
 */

interface Env {
	COMTRADE_KEY?: string;
	COMTRADE_KEY_2?: string;
}

type Row = { period: number; flowCode: string; primaryValue: number };

const API_BASE = 'https://comtradeapi.un.org';
const CACHE_SECONDS = 60 * 60 * 24;
const MAX_RETRIES = 4; // on HTTP 429
const ALLOWED_ORIGINS = [/^https:\/\/ovalvoi\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

const PARAM_RULES: Record<string, RegExp> = {
	reporterCode: /^\d{1,4}$/,
	partnerCode: /^\d{1,4}$/,
	period: /^\d{4}(,\d{4}){0,11}$/,
	cmdCode: /^(TOTAL|\d{2}(,\d{2}){0,23})$/,
};

class UpstreamError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

function corsHeaders(origin: string | null): Record<string, string> {
	const allowed = origin && ALLOWED_ORIGINS.some((re) => re.test(origin));
	return allowed
		? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' }
		: { Vary: 'Origin' };
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
	});
}

async function callComtrade(path: string, params: URLSearchParams, key?: string): Promise<Row[]> {
	const query = new URLSearchParams({
		...Object.fromEntries(params),
		flowCode: 'M,X',
		// Only the totals rows; otherwise breakdowns by partner2 / customs / transport mode get double-counted.
		partner2Code: '0',
		customsCode: 'C00',
		motCode: '0',
		includeDesc: 'false',
	});
	const headers: Record<string, string> = {
		Accept: 'application/json', // Comtrade returns an empty body without this
		'User-Agent': 'tradeDashboard-proxy (+https://github.com/Ovalvoi/tradeDashboard)',
	};
	if (key) headers['Ocp-Apim-Subscription-Key'] = key;

	let res: Response;
	let body: any = null;
	for (let attempt = 0; ; attempt++) {
		res = await fetch(`${API_BASE}${path}?${query}`, { headers });
		const text = await res.text();
		try {
			body = text ? JSON.parse(text) : null;
		} catch {
			body = null;
		}
		if (res.status !== 429 || attempt >= MAX_RETRIES) break;
		// "Rate limit is exceeded. Try again in 3 seconds."
		const wait = Number(/(\d+)\s*second/.exec(body?.message ?? '')?.[1] ?? 2);
		await new Promise((r) => setTimeout(r, Math.min(wait, 10) * 1000 + 250));
	}
	if (!res.ok) throw new UpstreamError(res.status, body?.message || body?.error || `Comtrade HTTP ${res.status}`);
	if (!body) throw new UpstreamError(502, 'Empty response from Comtrade');
	if (body.error) throw new UpstreamError(502, String(body.error));

	return (body.data ?? []).map((r: any) => ({ period: r.period, flowCode: r.flowCode, primaryValue: r.primaryValue }));
}

async function fetchWithKeys(params: URLSearchParams, env: Env): Promise<Row[]> {
	const keys = [env.COMTRADE_KEY, env.COMTRADE_KEY_2].filter(Boolean) as string[];
	let lastError: unknown;
	for (const key of keys) {
		try {
			return await callComtrade('/data/v1/get/C/A/HS', params, key);
		} catch (err) {
			lastError = err;
			// Try the secondary key for auth, quota and transient errors.
			if (!(err instanceof UpstreamError) || ![401, 403, 429, 500, 502, 503].includes(err.status)) throw err;
		}
	}
	throw lastError ?? new UpstreamError(401, 'No API key configured');
}

async function fetchPublic(params: URLSearchParams): Promise<Row[]> {
	// The preview endpoint allows one period per call (max 500 rows) and is rate-limited,
	// so query year by year, sequentially. 24 HS chapters x 2 flows = 48 rows, well under 500.
	const rows: Row[] = [];
	for (const year of params.get('period')!.split(',')) {
		const one = new URLSearchParams(params);
		one.set('period', year);
		rows.push(...(await callComtrade('/public/v1/preview/C/A/HS', one)));
	}
	return rows;
}

async function getTrade(params: URLSearchParams, env: Env): Promise<{ data: Row[]; source: string }> {
	if (env.COMTRADE_KEY || env.COMTRADE_KEY_2) {
		try {
			return { data: await fetchWithKeys(params, env), source: 'api' };
		} catch (err) {
			// Key not entitled / invalid: keep the dashboard working on the public endpoint.
			if (!(err instanceof UpstreamError) || ![401, 403].includes(err.status)) throw err;
			console.warn('Keyed request rejected, using public endpoint:', err.message);
		}
	}
	return { data: await fetchPublic(params), source: 'public' };
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const cors = corsHeaders(request.headers.get('Origin'));

		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
		if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, cors);
		if (url.pathname === '/' || url.pathname === '/health') return json({ ok: true }, 200, cors);
		if (url.pathname !== '/trade') return json({ error: 'Not found' }, 404, cors);

		// Validate and normalise parameters (also gives a stable cache key).
		const params = new URLSearchParams();
		for (const [name, rule] of Object.entries(PARAM_RULES)) {
			const value = url.searchParams.get(name) ?? '';
			if (!rule.test(value)) return json({ error: `Invalid or missing parameter: ${name}` }, 400, cors);
			params.set(name, value);
		}

		const cache = caches.default;
		const cacheKey = new Request(`${url.origin}/trade?${params}`);
		const cached = await cache.match(cacheKey);
		if (cached) {
			const res = new Response(cached.body, cached);
			Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
			res.headers.set('X-Cache', 'HIT');
			return res;
		}

		try {
			const result = await getTrade(params, env);
			const response = json(result, 200, { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` });
			ctx.waitUntil(cache.put(cacheKey, response.clone()));
			Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
			response.headers.set('X-Cache', 'MISS');
			return response;
		} catch (err) {
			const status = err instanceof UpstreamError && err.status === 429 ? 429 : 502;
			console.error('Comtrade request failed:', err);
			return json({ error: err instanceof Error ? err.message : 'Upstream error' }, status, cors);
		}
	},
};
