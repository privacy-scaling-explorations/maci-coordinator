import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      exclude: [
        "fs",
        "path",
        "assert",
        "child_process",
        "cluster",
        "console",
        "constants",
        "dgram",
        "dns",
        "domain",
        "events",
        "fs",
        "http",
        "https",
        "http2",
        "module",
        "net",
        "os",
        "path",
        "punycode",
        "process",
        "querystring",
        "readline",
        "repl",
        "_stream_duplex",
        "_stream_passthrough",
        "_stream_readable",
        "_stream_transform",
        "_stream_writable",
        "string_decoder",
        "sys",
        "timers/promises",
        "timers",
        "tls",
        "tty",
        "url",
        "util",
        "vm",
        "zlib", // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    react(),
  ],
});