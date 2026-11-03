# International Trade Dashboard

Bilateral import/export charts from the [UN Comtrade](https://comtradeplus.un.org/) database, in English and Hebrew.

Developed for Dr. Erez Shoshani's *Israel's Foreign Policy* course assignment, Ruppin Academic Center.

## How it works

```
GitHub Pages (index.html + assets/)  ──►  Cloudflare Worker (proxy/)  ──►  comtradeapi.un.org
```

- **Frontend**: static HTML/JS on GitHub Pages, charts with Chart.js. No API key in the browser.
- **Proxy** (`proxy/`): a Cloudflare Worker at `https://comtrade-proxy.yuval8787.workers.dev` that
  holds the Comtrade subscription keys as secrets, allows CORS only from the dashboard's origin,
  validates requests and caches responses for 24 hours.
  If the keys are rejected it falls back to Comtrade's keyless public preview endpoint (slower).

## Working on the proxy

Requires the Cloudflare CLI: `npm install --global cf`, then `cf auth login`.

```sh
cd proxy
npm install
cp .dev.vars.example .dev.vars   # put the Comtrade keys here (gitignored)
npm run dev                      # local server on http://localhost:5173
npm run deploy                   # deploys and uploads the keys as secrets
```

Test: `https://comtrade-proxy.yuval8787.workers.dev/trade?reporterCode=376&partnerCode=31&period=2023&cmdCode=TOTAL`
(the response's `source` field says whether the keyed API or the public fallback was used).

API keys are managed at UN Comtrade → My Comtrade → My API portal.
