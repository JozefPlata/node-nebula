import { defineConfig } from "vite"

export default defineConfig({
    build: {
        // outDir: "./../bjs",
        // rollupOptions: {
        //     output: {
        //         chunkFileNames: ""
        //     }
        // }
        // rollupOptions: {
        //     output: {
        //         manualChunks(id) {
        //             // @ts-ignore
        //             if (id.includes("node_modules")) {
        //                 return "vendor"
        //             }
        //         }
        //     }
        // }
    }
})