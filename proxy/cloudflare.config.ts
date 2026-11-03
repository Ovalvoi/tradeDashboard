import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "comtrade-proxy",
		compatibilityDate: "2026-11-01",
		entrypoint,
		env: {
			// UN Comtrade subscription key. The value lives in .dev.vars (gitignored) and is
			// uploaded with: npm run deploy  (cf deploy --secrets-file .dev.vars)
			// An optional COMTRADE_KEY_2 backup key is also supported by src/index.ts.
			COMTRADE_KEY: bindings.secret(),
		},
	},
});
