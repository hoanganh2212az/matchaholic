import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds a standard Next.js app for Vercel with modular architecture", async () => {
  const [packageJson, page, layout, header, hero, menu, orderPanel] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("components/Header.tsx", root), "utf8"),
    readFile(new URL("components/Hero.tsx", root), "utf8"),
    readFile(new URL("data/menu.ts", root), "utf8"),
    readFile(new URL("components/OrderPanel.tsx", root), "utf8"),
  ]);

  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.start, "next start");
  assert.ok(pkg.dependencies.next);
  assert.doesNotMatch(packageJson, /vinext|wrangler|@cloudflare\/vite-plugin/);

  // App & components structure
  assert.match(page, /DrinkCard/);
  assert.match(page, /CustomizationModal/);
  assert.match(header, /matcha\.holic/);
  assert.match(hero, /menu-drinks\.png/);
  assert.match(hero, /menu-pastries-coffee\.png/);
  assert.match(menu, /Matcha Sữa Bò/);
  assert.match(menu, /Pain au Chocolat/);
  assert.match(orderPanel, /Facebook Messenger/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /matchaholic\.vercel\.app/);
});

test("emits Next.js build artifacts", async () => {
  await access(new URL(".next/package.json", root));
  await access(new URL(".next/server/app/page.js", root));
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});

test("validates Vietnamese phone numbers correctly", async () => {
  const { isValidVietnamesePhone } = await import("../lib/validation.ts");
  assert.equal(isValidVietnamesePhone("0901234567"), true);
  assert.equal(isValidVietnamesePhone("0381234567"), true);
  assert.equal(isValidVietnamesePhone("+84901234567"), true);
  assert.equal(isValidVietnamesePhone("12345"), false);
  assert.equal(isValidVietnamesePhone("0123456789012"), false);
  assert.equal(isValidVietnamesePhone("abcdefghij"), false);
});

test("generates readable order text with customization details", async () => {
  const { generateOrderText } = await import("../lib/formatters.ts");
  const orderText = generateOrderText(
    {
      name: "Tuan",
      phone: "0901234567",
      fulfillment: "Delivery",
      address: "123 Le Loi, Q1",
      note: "Giao buoi sang",
    },
    [
      {
        key: "item-1",
        itemId: "matcha-sua-bo",
        name: "Matcha Sữa Bò",
        english: "Matcha Latte",
        category: "matcha",
        size: "M",
        price: 29,
        matcha: "Matcha Satoen",
        sweetness: "70% đường",
        ice: "50% đá",
        extras: [{ id: "salted-cream", name: "Kem mặn", price: 8 }],
        quantity: 2,
      },
    ],
    74,
  );

  assert.match(orderText, /Matcha\.holic order/);
  assert.match(orderText, /Name: Tuan/);
  assert.match(orderText, /Phone: 0901234567/);
  assert.match(orderText, /Address: 123 Le Loi, Q1/);
  assert.match(orderText, /2 x Matcha Sữa Bò/);
  assert.match(orderText, /Kem mặn/);
  assert.match(orderText, /Total: 74\.000 VND/);
});

test("formats Vietnamese phone numbers and generates order codes correctly", async () => {
  const { normalizeVietnamesePhone, formatPhoneDisplay, generateOrderCode } =
    await import("../lib/supabase.ts");

  assert.equal(normalizeVietnamesePhone("0901234567"), "+84901234567");
  assert.equal(normalizeVietnamesePhone("+84901234567"), "+84901234567");
  assert.equal(normalizeVietnamesePhone("84901234567"), "+84901234567");

  const display = formatPhoneDisplay("+84901234567");
  assert.equal(display, "0901 234 567");

  const code = generateOrderCode();
  assert.match(code, /^MH-\d{4}$/);
});

test("includes order code in generated order text", async () => {
  const { generateOrderText } = await import("../lib/formatters.ts");
  const textWithCode = generateOrderText(
    {
      name: "Chau",
      phone: "0901234567",
      fulfillment: "Pickup",
      address: "",
      note: "",
    },
    [],
    0,
    "MH-9999",
  );

  assert.match(textWithCode, /Matcha\.holic order #MH-9999/);
  assert.match(textWithCode, /Xác nhận đơn để tích điểm/);
});

test("appends loyalty registration message when customer opts into membership", async () => {
  const { generateOrderText } = await import("../lib/formatters.ts");
  const newMemberText = generateOrderText(
    {
      name: "Chau",
      phone: "0901234567",
      fulfillment: "Pickup",
      address: "",
      note: "",
    },
    [],
    0,
    "MH-1234",
    {
      optedIn: true,
      isNewMember: true,
      phone: "0901234567",
    },
  );

  assert.match(
    newMemberText,
    /Mình muốn đăng kí tích điểm, bạn kích hoạt cho số điện thoại: 0901234567 nha\. Hẹn gặp Matchaholic lần tiếp theo!/,
  );

  const existingMemberText = generateOrderText(
    {
      name: "Chau",
      phone: "0901234567",
      fulfillment: "Pickup",
      address: "",
      note: "",
    },
    [],
    0,
    "MH-1234",
    {
      optedIn: true,
      isNewMember: false,
      phone: "0901234567",
    },
  );

  assert.match(existingMemberText, /Khách hàng thân thiết: Tích điểm cho SĐT 0901234567/);
});

