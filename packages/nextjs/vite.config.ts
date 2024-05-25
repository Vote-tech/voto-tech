import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import mkcert from "vite-plugin-mkcert";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_CHAIN_NAME",
  "NEXT_PUBLIC_BUNDLER_URL",
  "NEXT_PUBLIC__JSON_RPC_PROVIDER",
  "NEXT_PUBLIC__PAYMASTER_URL",
  "GITHUB_TOKEN",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  for (const key of REQUIRED_ENV_VARS) {
    if (!env[key]) {
      throw new Error(`Environment variable ${key} is missing`);
    }
  }

  console.log("Loaded environment variables:", env);

  return {
    plugins: [
      react(),
      mkcert({
        source: "github",
        token: env.GITHUB_TOKEN,
      }),
    ],
    server: { https: true }, // Not needed for Vite 5+
  };
});
