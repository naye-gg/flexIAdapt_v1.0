import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    // Proxy deshabilitado para usar backend remoto
    // server: {
    //     proxy: {
    //         '/api': {
    //             target: 'http://localhost:5000',
    //             changeOrigin: true,
    //         },
    //     },
    // },
});
