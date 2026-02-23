import path from "path"
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Rewrite SPA routes to app.html
function spaFallback(): Plugin {
    const spaRoutes = ['/dashboard', '/get-started', '/onboard', '/login']
    const staticRoutes: Record<string, string> = { '/pricing': '/pricing.html' }
    return {
        name: 'spa-fallback',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (req.url) {
                    const staticMatch = Object.keys(staticRoutes).find(r => req.url!.startsWith(r))
                    if (staticMatch) {
                        req.url = staticRoutes[staticMatch]
                    } else if (spaRoutes.some(r => req.url!.startsWith(r))) {
                        req.url = '/app.html'
                    }
                }
                next()
            })
        },
    }
}

export default defineConfig({
    plugins: [spaFallback(), react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        watch: {
            ignored: ['**/my-video/**', '**/trigger/**', '**/.agent/**'],
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                app: path.resolve(__dirname, 'app.html'),
                pricing: path.resolve(__dirname, 'pricing.html'),
            },
        },
    },
})
