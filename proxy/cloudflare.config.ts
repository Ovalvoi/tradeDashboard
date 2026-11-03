import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "comtrade-proxy",
		compatibilityDate: "2026-11-01",
		entrypoint,
		env: {
			// UN Comtrade subscription keys. Values live in .dev.vars (gitignored) and are
			// uploaded with: npm run deploy  (cf deploy --secrets-file .dev.vars)
			COMTRADE_KEY: bindings.secret(),
			COMTRADE_KEY_2: bindings.secret(),
		},
	},
});
