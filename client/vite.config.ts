import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tsCongigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsCongigPaths(), react()],
  build: {
    rollupOptions: {
      output: {
        dir: "../server/dist/public",
      },
    },
  },
})
