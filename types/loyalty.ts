import type { CartItem } from "./menu";

export type UserRole = "customer" | "manager" | "admin";

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  loyaltyPoints: number;
  preferences?: string;
  createdAt: string;
  lastOrderAt?: string;
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface OrderRecord {
  id: string;
  orderCode: string; // e.g. MH-1082
  customerId?: string;
  customerName: string;
  customerPhone: string;
  fulfillment: "Pickup" | "Delivery";
  address?: string;
  note?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  pointsAwarded: number;
  confirmedAt?: string;
  confirmedBy?: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  profileId: string;
  orderId?: string;
  orderCode?: string;
  pointsChange: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}
