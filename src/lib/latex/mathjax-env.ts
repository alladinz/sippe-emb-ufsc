// Defines MathJax's expected PACKAGE_VERSION global before mathjax-full loads,
// preventing components/version.js from calling eval('require')(__dirname + '/../../package.json')
// inside bundled runtimes (Next.js Server Components, Turbopack, or Browser).
const globalTarget = globalThis as Record<string, unknown>;
if (typeof globalTarget["PACKAGE_VERSION"] === "undefined") {
  globalTarget["PACKAGE_VERSION"] = "3.2.1";
}
export {};
