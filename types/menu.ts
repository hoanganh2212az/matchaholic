export type Category = "matcha" | "pastry" | "coffee";
export type Size = "M" | "L";

export type SweetnessLevel = "100%" | "70%" | "50%" | "30%" | "0%";
export type IceLevel = "100%" | "70%" | "50%" | "Không đá" | "Nóng";

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  english: string;
  category: Category;
  accent: string;
  prices: Partial<Record<Size, number>>;
  badge?: string;
  extras?: Extra[];
  description?: string;
};

export type CartItem = {
  key: string;
  itemId: string;
  name: string;
  english: string;
  category: Category;
  size?: Size;
  price: number;
  extras: Extra[];
  matcha?: string;
  sweetness?: string;
  ice?: string;
  quantity: number;
};

export type CustomerInfo = {
  name: string;
  phone: string;
  fulfillment: "Pickup" | "Delivery";
  address: string;
  note: string;
};
