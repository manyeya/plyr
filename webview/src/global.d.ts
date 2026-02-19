// Tells TypeScript that CSS files imported via esbuild's text loader are strings
declare module "*.css" {
    const css: string;
    export default css;
}
