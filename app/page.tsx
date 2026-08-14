"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Category = "matcha" | "pastry" | "coffee";
type Size = "M" | "L";

type MenuItem = {
  id: string;
  name: string;
  english: string;
  category: Category;
  accent: string;
  prices: Partial<Record<Size, number>>;
  badge?: string;
  extras?: Extra[];
};

type Extra = {
  id: string;
  name: string;
  price: number;
};

type CartItem = {
  key: string;
  itemId: string;
  name: string;
  english: string;
  category: Category;
  size?: Size;
  price: number;
  extras: Extra[];
  matcha?: string;
  quantity: number;
};

const facebookPage = "https://m.me/61564439125616";

const matchaChoices = [
  "Matcha Satoen",
  "Matcha Special Mix",
  "Matcha Uji Ceremonial",
];

const toppings: Extra[] = [
  { id: "salted-cream", name: "Kem man", price: 8 },
  { id: "white-boba", name: "Tran chau trang", price: 5 },
  { id: "red-beans", name: "Dau do", price: 8 },
];

const drinks: MenuItem[] = [
  {
    id: "matcha-sua-bo",
    name: "Matcha Sua Bo",
    english: "Matcha Latte (Cow Milk)",
    category: "matcha",
    accent: "green",
    prices: { M: 29, L: 51 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "matcha-yen-mach",
    name: "Matcha Yen Mach",
    english: "Matcha Latte (Oat Milk)",
    category: "matcha",
    accent: "soft",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "matcha-sua-mix",
    name: "Matcha Sua Mix",
    english: "Matcha Latte (Cow + Oat)",
    category: "matcha",
    accent: "green",
    prices: { M: 35, L: 56 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "choco-sua-hat",
    name: "Choco Sua Hat",
    english: "Choco Latte",
    category: "matcha",
    accent: "cocoa",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-choco", name: "2g choco", price: 8 }],
  },
  {
    id: "chuoi-latte",
    name: "Chuoi Latte",
    english: "Banana Matcha Latte / Banana Choco Latte",
    category: "matcha",
    accent: "banana",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-matcha-choco", name: "2g matcha/choco", price: 8 }],
  },
  {
    id: "coco-matcha",
    name: "Coco Matcha",
    english: "Matcha Coconut Water",
    category: "matcha",
    accent: "green",
    prices: { M: 40, L: 61 },
  },
  {
    id: "matcha-khoai-mon",
    name: "Matcha Khoai Mon",
    english: "Taro Matcha Latte",
    category: "matcha",
    accent: "taro",
    prices: { M: 42, L: 66 },
    extras: [
      { id: "extra-matcha", name: "2g matcha", price: 8 },
      { id: "extra-taro", name: "20g khoai mon", price: 8 },
    ],
  },
  {
    id: "matcha-xoai",
    name: "Matcha Xoai",
    english: "Mango Matcha Latte",
    category: "matcha",
    accent: "mango",
    prices: { M: 42, L: 66 },
    extras: [
      { id: "extra-matcha", name: "2g matcha", price: 8 },
      { id: "extra-mango", name: "10g xoai", price: 8 },
    ],
  },
];

const pastries: MenuItem[] = [
  {
    id: "almond-croissant",
    name: "Croissant hanh nhan",
    english: "Almond Croissant",
    category: "pastry",
    accent: "pastry",
    prices: { M: 41 },
  },
  {
    id: "garlic-butter-croissant",
    name: "Croissant bo toi",
    english: "Garlic Butter Croissant",
    category: "pastry",
    accent: "pastry",
    prices: { M: 41 },
  },
  {
    id: "pain-au-chocolat",
    name: "Pain au Chocolat",
    english: "Chocolate pastry",
    category: "pastry",
    accent: "cocoa",
    prices: { M: 38 },
    badge: "Must try",
  },
];

const coffees: MenuItem[] = [
  {
    id: "ca-phe-den",
    name: "Ca phe Den",
    english: "Black Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "ca-phe-nau",
    name: "Ca phe Nau",
    english: "Brown Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "bac-xiu",
    name: "Bac xiu",
    english: "White Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "ca-phe-muoi",
    name: "Ca phe Muoi",
    english: "Salted Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
];

function money(value: number) {
  return `${value}.000 VND`;
}

function compactMoney(value: number) {
  return `${value}k`;
}

function pickExtras(
  selectedExtras: string[],
  itemExtras: Extra[] = [],
  selectedToppings: string[],
) {
  const itemAddOns = itemExtras.filter((extra) =>
    selectedExtras.includes(extra.id),
  );
  const toppingAddOns = toppings.filter((extra) =>
    selectedToppings.includes(extra.id),
  );

  return [...itemAddOns, ...toppingAddOns];
}

function ProductArt({ accent, category }: { accent: string; category: Category }) {
  return (
    <div className={`product-art ${accent}`} aria-hidden="true">
      {category === "pastry" ? (
        <span className="croissant">
          <i />
        </span>
      ) : category === "coffee" ? (
        <span className="coffee-cup">
          <i />
        </span>
      ) : (
        <>
          <span className="cup">
            <i />
          </span>
          <span className="carton">
            <i />
          </span>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [matcha, setMatcha] = useState(matchaChoices[0]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState("Pickup");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => {
    const extras = item.extras.reduce((extraSum, extra) => extraSum + extra.price, 0);
    return sum + (item.price + extras) * item.quantity;
  }, 0);

  const orderText = useMemo(() => {
    const lines = ["Matcha.holic order", ""];

    if (customerName.trim()) lines.push(`Name: ${customerName.trim()}`);
    if (phone.trim()) lines.push(`Phone: ${phone.trim()}`);
    lines.push(`Method: ${fulfillment}`);
    if (address.trim()) lines.push(`Address: ${address.trim()}`);
    if (note.trim()) lines.push(`Note: ${note.trim()}`);
    lines.push("", "Items:");

    if (cart.length === 0) {
      lines.push("- No items yet");
    } else {
      cart.forEach((cartItem) => {
        const extrasTotal = cartItem.extras.reduce(
          (sum, extra) => sum + extra.price,
          0,
        );
        const details = [
          cartItem.size ? `size ${cartItem.size}` : null,
          cartItem.matcha,
          cartItem.extras.length
            ? `extras: ${cartItem.extras.map((extra) => extra.name).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("; ");

        lines.push(
          `- ${cartItem.quantity} x ${cartItem.name}${
            details ? ` (${details})` : ""
          } - ${money((cartItem.price + extrasTotal) * cartItem.quantity)}`,
        );
      });
    }

    lines.push("", `Total: ${money(total)}`);
    return lines.join("\n");
  }, [address, cart, customerName, fulfillment, note, phone, total]);

  function toggleSelection(
    value: string,
    setter: (next: string[]) => void,
    selected: string[],
  ) {
    setter(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    );
  }

  function addProduct(product: MenuItem, size: Size = "M") {
    const basePrice = product.prices[size] ?? product.prices.M;
    if (!basePrice) return;

    const extras =
      product.category === "matcha"
        ? pickExtras(selectedExtras, product.extras, selectedToppings)
        : [];
    const matchaChoice = product.category === "matcha" ? matcha : undefined;
    const key = [
      product.id,
      size,
      matchaChoice ?? "",
      extras.map((extra) => extra.id).sort().join("."),
    ].join("|");

    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem.key === key);
      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.key === key
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }

      return [
        ...currentCart,
        {
          key,
          itemId: product.id,
          name: product.name,
          english: product.english,
          category: product.category,
          size: product.category === "matcha" ? size : undefined,
          price: basePrice,
          extras,
          matcha: matchaChoice,
          quantity: 1,
        },
      ];
    });
    setCopyStatus("");
  }

  function updateQuantity(key: string, direction: 1 | -1) {
    setCart((currentCart) =>
      currentCart.flatMap((cartItem) => {
        if (cartItem.key !== key) return cartItem;
        const nextQuantity = cartItem.quantity + direction;
        return nextQuantity > 0 ? [{ ...cartItem, quantity: nextQuantity }] : [];
      }),
    );
    setCopyStatus("");
  }

  async function copyOrder() {
    if (cart.length === 0) {
      setCopyStatus("Add an item first.");
      return false;
    }

    try {
      await navigator.clipboard.writeText(orderText);
      setCopyStatus("Order copied.");
      return true;
    } catch {
      setCopyStatus("Copy blocked. Select the order text below.");
      return false;
    }
  }

  function sendToFacebook() {
    if (cart.length === 0) {
      setCopyStatus("Add an item first.");
      return;
    }

    void copyOrder();
    window.open(
      `${facebookPage}?text=${encodeURIComponent(orderText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="site-shell">
      <header className="hero">
        <nav className="topbar" aria-label="Primary navigation">
          <a className="brand" href="#menu" aria-label="Matcha.holic menu">
            <span>matcha.holic</span>
          </a>
          <div className="nav-actions">
            <a href="#menu">Menu</a>
            <a href="#order">Order</a>
          </div>
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Homemade matcha bar</p>
            <h1>matcha.holic</h1>
            <p>
              Matcha lattes, oat milk blends, coconut matcha, pastries, and
              Vietnamese coffee in one quick order sheet.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#menu">
                Order from menu
              </a>
              <a
                className="secondary-link"
                href={facebookPage}
                rel="noreferrer"
                target="_blank"
              >
                Facebook page
              </a>
            </div>
          </div>

          <div className="poster-stack" aria-label="Original menu posters">
            <Image
              src="/menu-drinks.png"
              alt="Matcha.holic drinks menu poster"
              width={750}
              height={916}
              priority
            />
            <Image
              src="/menu-pastries-coffee.png"
              alt="Matcha.holic pastries and coffee menu poster"
              width={750}
              height={916}
            />
          </div>
        </section>
      </header>

      <div className="marquee" aria-hidden="true">
        <span>
          MATCHA.HOLIC FRESH MATCHA LATTE COCONUT MATCHA PASTRIES COFFEE
        </span>
        <span>
          MATCHA.HOLIC FRESH MATCHA LATTE COCONUT MATCHA PASTRIES COFFEE
        </span>
      </div>

      <section className="content-grid" id="menu">
        <div className="menu-area">
          <div className="section-heading">
            <p>Menu</p>
            <h2>Matcha drinks</h2>
          </div>

          <div className="drink-grid">
            {drinks.map((product) => (
              <article className={`product-card ${product.accent}`} key={product.id}>
                <ProductArt accent={product.accent} category={product.category} />
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.english}</p>
                </div>
                <div className="price-row" aria-label={`${product.name} prices`}>
                  <button onClick={() => addProduct(product, "M")} type="button">
                    <span>M</span>
                    {compactMoney(product.prices.M ?? 0)}
                  </button>
                  <button onClick={() => addProduct(product, "L")} type="button">
                    <span>L</span>
                    {compactMoney(product.prices.L ?? 0)}
                  </button>
                </div>
                {product.extras ? (
                  <p className="extras-line">
                    Extra {product.extras.map((extra) => `${extra.name} +${extra.price}k`).join(" / ")}
                  </p>
                ) : (
                  <p className="extras-line">Clean coconut matcha finish</p>
                )}
              </article>
            ))}
          </div>

          <div className="split-menu">
            <section className="menu-band pastry-band" aria-labelledby="pastries">
              <div className="band-title">
                <p>Pastries</p>
                <h2 id="pastries">Banh ngot</h2>
              </div>
              <div className="simple-grid">
                {pastries.map((product) => (
                  <article className="simple-card" key={product.id}>
                    {product.badge ? <span className="badge">{product.badge}</span> : null}
                    <ProductArt accent={product.accent} category={product.category} />
                    <h3>{product.name}</h3>
                    <p>{product.english}</p>
                    <button onClick={() => addProduct(product)} type="button">
                      Add {compactMoney(product.prices.M ?? 0)}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="menu-band coffee-band" aria-labelledby="coffee">
              <div className="band-title">
                <p>Coffee - same price 29k</p>
                <h2 id="coffee">Ca phe</h2>
              </div>
              <div className="coffee-list">
                {coffees.map((product) => (
                  <button
                    className="coffee-button"
                    key={product.id}
                    onClick={() => addProduct(product)}
                    type="button"
                  >
                    <span>{product.name}</span>
                    <small>{product.english}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="order-panel" id="order" aria-label="Order panel">
          <div className="panel-section">
            <p className="panel-kicker">Customize drinks</p>
            <h2>Your matcha</h2>
            <div className="segmented-control" role="group" aria-label="Choose matcha">
              {matchaChoices.map((choice) => (
                <button
                  className={matcha === choice ? "selected" : ""}
                  key={choice}
                  onClick={() => setMatcha(choice)}
                  type="button"
                >
                  {choice.replace("Matcha ", "")}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>Extras</h3>
            <div className="check-list">
              {[...new Map(drinks.flatMap((drink) => drink.extras ?? []).map((extra) => [extra.id, extra])).values()].map(
                (extra) => (
                  <label key={extra.id}>
                    <input
                      checked={selectedExtras.includes(extra.id)}
                      onChange={() =>
                        toggleSelection(extra.id, setSelectedExtras, selectedExtras)
                      }
                      type="checkbox"
                    />
                    <span>{extra.name}</span>
                    <b>+{extra.price}k</b>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="panel-section">
            <h3>Toppings</h3>
            <div className="check-list">
              {toppings.map((extra) => (
                <label key={extra.id}>
                  <input
                    checked={selectedToppings.includes(extra.id)}
                    onChange={() =>
                      toggleSelection(extra.id, setSelectedToppings, selectedToppings)
                    }
                    type="checkbox"
                  />
                  <span>{extra.name}</span>
                  <b>+{extra.price}k</b>
                </label>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="cart-heading">
              <h2>Order</h2>
              <span>{itemCount} items</span>
            </div>
            <div className="cart-list">
              {cart.length === 0 ? (
                <p className="empty-cart">Choose a drink, pastry, or coffee.</p>
              ) : (
                cart.map((cartItem) => {
                  const extrasPrice = cartItem.extras.reduce(
                    (sum, extra) => sum + extra.price,
                    0,
                  );
                  return (
                    <article className="cart-item" key={cartItem.key}>
                      <div>
                        <h3>
                          {cartItem.name}
                          {cartItem.size ? ` ${cartItem.size}` : ""}
                        </h3>
                        <p>
                          {[cartItem.matcha, ...cartItem.extras.map((extra) => extra.name)]
                            .filter(Boolean)
                            .join(" / ") || cartItem.english}
                        </p>
                      </div>
                      <div className="quantity-control">
                        <button
                          aria-label={`Remove one ${cartItem.name}`}
                          onClick={() => updateQuantity(cartItem.key, -1)}
                          type="button"
                        >
                          -
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button
                          aria-label={`Add one ${cartItem.name}`}
                          onClick={() => updateQuantity(cartItem.key, 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                      <strong>
                        {compactMoney((cartItem.price + extrasPrice) * cartItem.quantity)}
                      </strong>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel-section customer-form">
            <label>
              <span>Name</span>
              <input
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Your name"
                value={customerName}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                value={phone}
              />
            </label>
            <div className="fulfillment" role="group" aria-label="Choose order method">
              {["Pickup", "Delivery"].map((choice) => (
                <button
                  className={fulfillment === choice ? "selected" : ""}
                  key={choice}
                  onClick={() => setFulfillment(choice)}
                  type="button"
                >
                  {choice}
                </button>
              ))}
            </div>
            {fulfillment === "Delivery" ? (
              <label>
                <span>Address</span>
                <input
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Delivery address"
                  value={address}
                />
              </label>
            ) : null}
            <label>
              <span>Note</span>
              <textarea
                onChange={(event) => setNote(event.target.value)}
                placeholder="Less ice, less sweet..."
                value={note}
              />
            </label>
          </div>

          <div className="checkout">
            <div>
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="copy-button" onClick={copyOrder} type="button">
              Copy order
            </button>
            <button className="send-button" onClick={sendToFacebook} type="button">
              Send to Facebook
            </button>
            <p aria-live="polite">{copyStatus}</p>
            <textarea readOnly value={orderText} aria-label="Order text" />
          </div>
        </aside>
      </section>
    </main>
  );
}
