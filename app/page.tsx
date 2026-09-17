"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CustomerInfo, Extra, MenuItem, Size } from "../types/menu";
import {
  COFFEES,
  DRINKS,
  FACEBOOK_PAGE_ID,
  FACEBOOK_PAGE_URL,
  PASTRIES,
} from "../data/menu";
import { generateOrderText, type LoyaltyOrderMeta } from "../lib/formatters";
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
import {
  getCustomerOrders,
  registerOrGetCustomer,
  submitOrder,
  supabase,
} from "../lib/supabase";
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
  const [activeOrderCode, setActiveOrderCode] = useState<string>("");
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyOrderMeta>({
    optedIn: true,
  });
  const [preferences, setPreferences] = useState<string>("");

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

  // Clear customer's current cart if their past order has been confirmed
  useEffect(() => {
    const checkAndClearIfConfirmed = async () => {
      const phone = customer.phone.trim();
      if (!phone && !activeOrderCode) return;

      const orders = await getCustomerOrders(null, phone);
      const hasConfirmed = orders.some(
        (o) =>
          (o.status === "confirmed" || o.status === "completed") &&
          (activeOrderCode ? o.orderCode === activeOrderCode : true),
      );

      if (hasConfirmed && cart.length > 0) {
        updateCart([]);
      }
    };

    checkAndClearIfConfirmed();

    const handleFocus = () => {
      checkAndClearIfConfirmed();
    };
    window.addEventListener("focus", handleFocus);

    // Also listen in realtime for orders being confirmed
    const channel = supabase
      .channel("orders-cart-clearing")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          if (
            payload.new &&
            (payload.new.status === "confirmed" || payload.new.status === "completed")
          ) {
            const orderPhone = payload.new.customer_phone;
            const currentPhone = customer.phone.trim();
            if (
              (currentPhone && orderPhone === currentPhone) ||
              payload.new.order_code === activeOrderCode
            ) {
              updateCart([]);
            }
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, [customer.phone, activeOrderCode, cart.length]);

  const orderText = useMemo(
    () =>
      generateOrderText(
        customer,
        cart,
        total,
        activeOrderCode || undefined,
        loyaltyInfo,
      ),
    [customer, cart, total, activeOrderCode, loyaltyInfo],
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

  const ensureOrderSaved = useCallback(async () => {
    const validation = validateOrder(customer, cart);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return null;
    }

    let customerProfileId: string | null = null;
    if (loyaltyInfo.optedIn && customer.phone.trim()) {
      const profile = await registerOrGetCustomer({
        phone: customer.phone.trim(),
        name: customer.name.trim(),
        address: customer.address.trim(),
        preferences: preferences.trim() || undefined,
      });
      if (profile?.id) {
        customerProfileId = profile.id;
      }
    }

    const savedOrder = await submitOrder(
      {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        fulfillment: customer.fulfillment,
        address: customer.address.trim(),
        note: customer.note.trim(),
        items: cart,
        totalAmount: total,
      },
      customerProfileId,
    );

    setActiveOrderCode(savedOrder.orderCode);
    return savedOrder;
  }, [cart, customer, loyaltyInfo, preferences, total]);

  const handleCopyOrder = useCallback(
    async (successMessage?: string) => {
      const savedOrder = await ensureOrderSaved();
      if (!savedOrder) return false;

      const finalOrderText = generateOrderText(
        customer,
        cart,
        total,
        savedOrder.orderCode,
        loyaltyInfo,
      );

      try {
        await navigator.clipboard.writeText(finalOrderText);
        setCopyStatus(
          successMessage ||
            `Đã tạo đơn #${savedOrder.orderCode} & sao chép vào clipboard!`,
        );
        return true;
      } catch {
        setCopyStatus(
          `Đã tạo đơn #${savedOrder.orderCode}. Vui lòng sao chép nội dung bên dưới.`,
        );
        return false;
      }
    },
    [cart, customer, ensureOrderSaved, loyaltyInfo, total],
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

    const savedOrder = await ensureOrderSaved();
    if (!savedOrder) return;

    const finalOrderText = generateOrderText(
      customer,
      cart,
      total,
      savedOrder.orderCode,
      loyaltyInfo,
    );

    try {
      await navigator.clipboard.writeText(finalOrderText);
    } catch {
      // ignore
    }

    setCopyStatus(
      `Đã ghi nhận đơn #${savedOrder.orderCode}! Đang mở Messenger... Nhân viên quán sẽ xác nhận và tích điểm cho bạn.`,
    );

    // Clear current cart now that order has been submitted
    updateCart([]);

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const messengerUrl = isMobile
      ? `${FACEBOOK_PAGE_URL}?text=${encodeURIComponent(finalOrderText)}`
      : `https://www.messenger.com/t/${FACEBOOK_PAGE_ID}?text=${encodeURIComponent(
          finalOrderText,
        )}`;

    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  }, [cart, customer, ensureOrderSaved, loyaltyInfo, total]);


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
          loyaltyInfo={loyaltyInfo}
          onUpdateLoyaltyInfo={setLoyaltyInfo}
          onUpdatePreferences={setPreferences}
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
