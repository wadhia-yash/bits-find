import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const LOCAL_DATABASE_ID = "00000000-0000-4000-8000-000000000000";
const usePolling = process.env.CHOKIDAR_USEPOLLING === "true";

const localBindings = {
  main: "./build/sites-worker.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: hostingConfig.d1
    ? [
        {
          binding: hostingConfig.d1,
          database_name: "bits-find-web",
          database_id: LOCAL_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: hostingConfig.r2
    ? [{ binding: hostingConfig.r2, bucket_name: "bits-find-web-photos" }]
    : [],
};

export default defineConfig(async ({ command }) => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep local development state inside the workspace.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler reads its log settings when the plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: usePolling
      ? { watch: { useFsEvents: false, usePolling: true } }
      : {},
    plugins: [
      vinext(),
      sites({ mockAuth: command === "serve" }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindings,
      }),
    ],
  };
});
