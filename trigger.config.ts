import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
    project: "proj_dlyggsixmmvoatjxtpjp",
    dirs: ["./trigger"],
    runtime: "node",
    logLevel: "info",
    maxDuration: 300, // 5 minutes max per task run
    retries: {
        enabledInDev: false,
        default: {
            maxAttempts: 3,
            minTimeoutInMs: 1000,
            maxTimeoutInMs: 30_000,
            factor: 1.8,
            randomize: true,
        },
    },
    build: {
        autoDetectExternal: true,
        keepNames: true,
        minify: false,
        extensions: [],
    },
});
