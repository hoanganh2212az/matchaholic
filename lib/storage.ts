import type { CartItem, CustomerInfo } from "../types/menu";

const CART_STORAGE_KEY = "matchaholic_cart_v1";
const CUSTOMER_STORAGE_KEY = "matchaholic_customer_v1";

const defaultCustomer: CustomerInfo = {
  name: "",
  phone: "",
  fulfillment: "Pickup",
  address: "",
  note: "",
};

const emptyCart: CartItem[] = [];

let cartCache: CartItem[] | null = null;
let customerCache: CustomerInfo | null = null;

const cartListeners = new Set<() => void>();
const customerListeners = new Set<() => void>();

function getCart(): CartItem[] {
  if (typeof window === "undefined") return emptyCart;
  if (cartCache !== null) return cartCache;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cartCache = raw ? JSON.parse(raw) : emptyCart;
  } catch {
    cartCache = emptyCart;
  }
  return cartCache ?? emptyCart;
}

export function subscribeCart(callback: () => void): () => void {
  cartListeners.add(callback);
  return () => cartListeners.delete(callback);
}

export function getCartSnapshot(): CartItem[] {
  return getCart();
}

export function getServerCartSnapshot(): CartItem[] {
  return emptyCart;
}

export function updateCart(
  next: CartItem[] | ((prev: CartItem[]) => CartItem[]),
): void {
  const current = getCart();
  const resolved = typeof next === "function" ? next(current) : next;
  cartCache = resolved;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(resolved));
  } catch {
    // Ignore storage write errors (e.g. private browsing quota)
  }
  cartListeners.forEach((listener) => listener());
}

function getCustomer(): CustomerInfo {
  if (typeof window === "undefined") return defaultCustomer;
  if (customerCache !== null) return customerCache;
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    customerCache = raw
      ? { ...defaultCustomer, ...JSON.parse(raw) }
      : defaultCustomer;
  } catch {
    customerCache = defaultCustomer;
  }
  return customerCache ?? defaultCustomer;
}

export function subscribeCustomer(callback: () => void): () => void {
  customerListeners.add(callback);
  return () => customerListeners.delete(callback);
}

export function getCustomerSnapshot(): CustomerInfo {
  return getCustomer();
}

export function getServerCustomerSnapshot(): CustomerInfo {
  return defaultCustomer;
}

export function updateCustomer(field: keyof CustomerInfo, value: string): void {
  const current = getCustomer();
  const next = { ...current, [field]: value };
  customerCache = next;
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write errors
  }
  customerListeners.forEach((listener) => listener());
}
