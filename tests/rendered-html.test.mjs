import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds a standard Next.js app for Vercel", async () => {
  const [packageJson, page, layout] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.start, "next start");
  assert.ok(pkg.dependencies.next);
  assert.doesNotMatch(packageJson, /vinext|wrangler|@cloudflare\/vite-plugin/);

  assert.match(page, /matcha\.holic/);
  assert.match(page, /Matcha Sua Bo/);
  assert.match(page, /Pain au Chocolat/);
  assert.match(page, /Send to Facebook/);
  assert.match(page, /menu-drinks\.png/);
  assert.match(page, /menu-pastries-coffee\.png/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /matchaholic\.vercel\.app/);
});

test("emits Next.js build artifacts", async () => {
  await access(new URL(".next/package.json", root));
  await access(new URL(".next/server/app/page.js", root));
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
