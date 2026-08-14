import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the matcha.holic storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>matcha\.holic menu<\/title>/i);
  assert.match(html, /matcha\.holic/);
  assert.match(html, /Matcha Sua Bo/);
  assert.match(html, /Matcha Yen Mach/);
  assert.match(html, /Pain au Chocolat/);
  assert.match(html, /Ca phe Muoi/);
  assert.match(html, /Send to Facebook/);
  assert.match(html, /menu-drinks\.png/);
  assert.match(html, /menu-pastries-coffee\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("removes the starter preview surface", async () => {
  await assert.rejects(access(new URL("app/_sites-preview", templateRoot)));
});
