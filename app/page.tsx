"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { CustomerInfo, Extra, MenuItem, Size } from "../types/menu";
import {
  COFFEES,
  DRINKS,
  FACEBOOK_PAGE_ID,
  FACEBOOK_PAGE_URL,
  PASTRIES,
} from "../data/menu";
import { generateOrderText } from "../lib/formatters";
import {
  getCartSnapshot,
  getCustomerSnapshot,
  getServerCartSnapshot,
  getServerCustomerSnapshot,
  subscribeCart,
  subscribeCustomer,
  updateCart,
  updateCustomer,
} from "../lib/storage";
import { validateOrder, type ValidationErrors } from "../lib/validation";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { DrinkCard } from "../components/DrinkCard";
import { CoffeeButton, PastryCard } from "../components/MenuItemCard";
import { CustomizationModal } from "../components/CustomizationModal";
import { OrderPanel } from "../components/OrderPanel";
import { FloatingCartBar } from "../components/FloatingCartBar";

export default function Home() {
  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const customer = useSyncExternalStore(
    subscribeCustomer,
    getCustomerSnapshot,
    getServerCustomerSnapshot,
  );

  const [copyStatus, setCopyStatus] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Modal customization state
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [defaultSize, setDefaultSize] = useState<Size>("M");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const extrasSum = item.extras.reduce(
          (sub, extra) => sub + extra.price,
          0,
        );
        return sum + (item.price + extrasSum) * item.quantity;
      }, 0),
    [cart],
  );

  const orderText = useMemo(
    () => generateOrderText(customer, cart, total),
    [customer, cart, total],
  );

  const handleOpenCustomize = useCallback(
    (product: MenuItem, size: Size = "M") => {
      setSelectedProduct(product);
      setDefaultSize(size);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleAddToCart = useCallback(
    (customized: {
      product: MenuItem;
      size: Size;
      matcha: string;
      sweetness: string;
      ice: string;
      extras: Extra[];
      quantity: number;
    }) => {
      const { product, size, matcha, sweetness, ice, extras, quantity } =
        customized;
      const basePrice = product.prices[size] ?? product.prices.M ?? 0;

      const extrasKey = extras
        .map((e) => e.id)
        .sort()
        .join(".");
      const key = [
        product.id,
        size,
        matcha,
        sweetness,
        ice,
        extrasKey,
      ].join("|");

      updateCart((currentCart) => {
        const existingIndex = currentCart.findIndex(
          (item) => item.key === key,
        );
        if (existingIndex > -1) {
          const updated = [...currentCart];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
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
            matcha: matcha || undefined,
            sweetness: sweetness || undefined,
            ice: ice || undefined,
            quantity,
          },
        ];
      });

      setValidationErrors((prev) => ({ ...prev, cart: undefined }));
      setCopyStatus("");
    },
    [],
  );

  const handleAddSimpleProduct = useCallback((product: MenuItem) => {
    const basePrice = product.prices.M ?? 0;
    const key = `${product.id}|M`;

    updateCart((currentCart) => {
      const existing = currentCart.find((item) => item.key === key);
      if (existing) {
        return currentCart.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item,
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
          price: basePrice,
          extras: [],
          quantity: 1,
        },
      ];
    });

    setValidationErrors((prev) => ({ ...prev, cart: undefined }));
    setCopyStatus("");
  }, []);

  const handleUpdateQuantity = useCallback(
    (key: string, direction: 1 | -1) => {
      updateCart((currentCart) =>
        currentCart.flatMap((item) => {
          if (item.key !== key) return item;
          const nextQuantity = item.quantity + direction;
          return nextQuantity > 0
            ? [{ ...item, quantity: nextQuantity }]
            : [];
        }),
      );
      setCopyStatus("");
    },
    [],
  );

  const handleRemoveItem = useCallback((key: string) => {
    updateCart((currentCart) => currentCart.filter((item) => item.key !== key));
    setCopyStatus("");
  }, []);

  const handleClearCart = useCallback(() => {
    updateCart([]);
    setCopyStatus("");
  }, []);

  const handleUpdateCustomer = useCallback(
    (field: keyof CustomerInfo, value: string) => {
      updateCustomer(field, value);
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleCopyOrder = useCallback(
    async (successMessage = "Đã sao chép nội dung đơn hàng vào clipboard!") => {
      const validation = validateOrder(customer, cart);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return false;
      }

      try {
        await navigator.clipboard.writeText(orderText);
        setCopyStatus(successMessage);
        return true;
      } catch {
        setCopyStatus(
          "Không thể tự động sao chép. Vui lòng chọn và sao chép bên dưới.",
        );
        return false;
      }
    },
    [cart, customer, orderText],
  );

  const handleSendToFacebook = useCallback(async () => {
    const validation = validateOrder(customer, cart);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstInvalid = document.querySelector(".input-invalid");
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    await handleCopyOrder(
      "Đã sao chép đơn hàng! Đang mở Messenger... Nếu khung chat trống, bạn chỉ cần nhấn Dán (Paste) nhé.",
    );

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const messengerUrl = isMobile
      ? `${FACEBOOK_PAGE_URL}?text=${encodeURIComponent(orderText)}`
      : `https://www.messenger.com/t/${FACEBOOK_PAGE_ID}?text=${encodeURIComponent(
          orderText,
        )}`;

    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  }, [cart, customer, handleCopyOrder, orderText]);

  const handleScrollToOrder = useCallback(() => {
    const orderSection = document.getElementById("order");
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <main className="site-shell">
      <header className="hero">
        <Header />
        <Hero />
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
          {/* Drinks Section */}
          <section id="drinks" className="menu-band-section">
            <div className="section-heading">
              <p>Menu</p>
              <h2>Đồ uống Matcha</h2>
            </div>

            <div className="drink-grid">
              {DRINKS.map((product) => (
                <DrinkCard
                  key={product.id}
                  product={product}
                  onCustomize={handleOpenCustomize}
                />
              ))}
            </div>
          </section>

          {/* Pastries & Coffees Section */}
          <div className="split-menu">
            <section
              className="menu-band pastry-band"
              id="pastries"
              aria-labelledby="pastries-heading"
            >
              <div className="band-title">
                <p>Pastries</p>
                <h2 id="pastries-heading">Bánh ngọt</h2>
              </div>
              <div className="simple-grid">
                {PASTRIES.map((product) => (
                  <PastryCard
                    key={product.id}
                    product={product}
                    onAdd={handleAddSimpleProduct}
                  />
                ))}
              </div>
            </section>

            <section
              className="menu-band coffee-band"
              id="coffee"
              aria-labelledby="coffee-heading"
            >
              <div className="band-title">
                <p>Coffee - đồng giá 29k</p>
                <h2 id="coffee-heading">Cà phê</h2>
              </div>
              <div className="coffee-list">
                {COFFEES.map((product) => (
                  <CoffeeButton
                    key={product.id}
                    product={product}
                    onAdd={handleAddSimpleProduct}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Order & Checkout Sidebar */}
        <OrderPanel
          cart={cart}
          customer={customer}
          onUpdateCustomer={handleUpdateCustomer}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          copyStatus={copyStatus}
          onCopyOrder={handleCopyOrder}
          onSendToFacebook={handleSendToFacebook}
          orderText={orderText}
          validationErrors={validationErrors}
        />
      </section>

      {/* Item Customization Modal */}
      <CustomizationModal
        key={
          selectedProduct
            ? `${selectedProduct.id}-${defaultSize}`
            : "modal-closed"
        }
        product={selectedProduct}
        defaultSize={defaultSize}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
      />

      {/* Floating mobile cart bar */}
      <FloatingCartBar
        itemCount={itemCount}
        total={total}
        onOpenCart={handleScrollToOrder}
      />
    </main>
  );
}
