const esbuild = require("esbuild");

const isWatch = process.argv.includes("--watch");

const extensionConfig = {
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outfile: "out/extension.js",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    target: "node20",
    sourcemap: true,
    minify: !isWatch,
};

const webviewConfig = {
    entryPoints: ["webview/src/index.tsx"],
    bundle: true,
    outfile: "out/webview/player.js",
    format: "iife",
    platform: "browser",
    target: ["es2020"],
    sourcemap: true,
    minify: !isWatch,
    define: {
        "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
    },
    loader: {
        ".css": "text",
        ".svg": "text",
    },
};

async function build() {
    if (isWatch) {
        const [extCtx, webCtx] = await Promise.all([
            esbuild.context(extensionConfig),
            esbuild.context(webviewConfig),
        ]);
        await Promise.all([extCtx.watch(), webCtx.watch()]);
        console.log("Watching for changes...");
    } else {
        await Promise.all([
            esbuild.build(extensionConfig),
            esbuild.build(webviewConfig),
        ]);
        console.log("Build complete.");
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
