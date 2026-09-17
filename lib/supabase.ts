import { createClient } from "@supabase/supabase-js";
import type {
  LoyaltyTransaction,
  OrderRecord,
  OrderStatus,
  UserProfile,
} from "../types/loyalty";
import type { CartItem } from "../types/menu";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// HELPERS
// ==========================================
export function normalizeVietnamesePhone(input: string): string {
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.startsWith("84")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+84${cleaned.slice(1)}`;
  return `+84${cleaned}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84")) {
    const local = "0" + digits.slice(2);
    if (local.length === 10) {
      return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
    }
    return local;
  }
  return phone;
}

export function generateOrderCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MH-${num}`;
}

// Convert phone to fake email for auth
function phoneToEmail(phone: string): string {
  return `${normalizeVietnamesePhone(phone).replace('+', '')}@matchaholic.vn`;
}

// ==========================================
// CUSTOMER & MEMBERSHIP SERVICE (Frictionless Phone-based)
// ==========================================

export async function checkCustomerByPhone(phone: string): Promise<{
  exists: boolean;
  profile?: UserProfile;
  orderCount: number;
}> {
  if (!phone || !phone.trim()) return { exists: false, orderCount: 0 };
  const raw = phone.trim();
  const formatted = normalizeVietnamesePhone(raw);

  // Check profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .or(`phone.eq.${raw},phone.eq.${formatted}`)
    .maybeSingle();

  // Check orders table for order history
  const orders = await getCustomerOrders(profile?.id || null, raw);

  if (profile) {
    // Derive true points from transactions ledger
    const { data: txs } = await supabase
      .from("loyalty_transactions")
      .select("points_change")
      .eq("profile_id", profile.id);
    let totalPoints = Number(profile.loyalty_points) || 0;
    if (txs && txs.length > 0) {
      const txTotal = txs.reduce((sum, tx) => sum + (Number(tx.points_change) || 0), 0);
      totalPoints = Math.max(totalPoints, txTotal);
    }
    const formattedProfile = {
      ...formatProfileRecord(profile),
      loyaltyPoints: totalPoints,
    };
    return { exists: true, profile: formattedProfile, orderCount: orders.length };
  }

  return { exists: false, orderCount: orders.length };
}

export async function registerOrGetCustomer(data: {
  phone: string;
  name: string;
  address?: string;
  preferences?: string;
}): Promise<UserProfile | null> {
  const raw = data.phone.trim();
  const formatted = normalizeVietnamesePhone(raw);

  // 1. Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .or(`phone.eq.${raw},phone.eq.${formatted}`)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, any> = {};
    if (data.name?.trim() && data.name.trim() !== existing.name) {
      updates.name = data.name.trim();
    }
    if (data.address?.trim() && data.address.trim() !== existing.address) {
      updates.address = data.address.trim();
    }
    if (data.preferences?.trim()) {
      updates.preferences = data.preferences.trim();
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", existing.id);
    }

    return formatProfileRecord({ ...existing, ...updates });
  }

  // 2. Insert new profile
  const newProfile: Record<string, any> = {
    phone: formatted,
    name: data.name?.trim() || "Khách hàng",
    address: data.address?.trim() || null,
    role: "customer",
    loyalty_points: 0,
  };
  if (data.preferences?.trim()) {
    newProfile.preferences = data.preferences.trim();
  }

  const { data: inserted, error } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (error) {
    console.error("Error creating customer profile:", error);
    return {
      id: "pending-" + Date.now(),
      phone: formatted,
      name: newProfile.name,
      role: "customer",
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };
  }

  return formatProfileRecord(inserted);
}

// ==========================================
// MANAGER AUTHENTICATION (Using Local Storage for demo Manager)
// ==========================================
export interface ManagerSession {
  email: string;
  role: "manager";
  loggedInAt: string;
}

export function getManagerSession(): ManagerSession | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem("manager_session");
  return val ? JSON.parse(val) : null;
}

export async function loginManager(
  email: string,
  pass: string,
): Promise<{ success: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const configuredEmail = (process.env.NEXT_PUBLIC_MANAGER_EMAIL || "manager").toLowerCase();
  const configuredPassword = process.env.NEXT_PUBLIC_MANAGER_PASSWORD || "admin";

  if (
    (cleanEmail === configuredEmail && pass === configuredPassword) ||
    (cleanEmail === "demo" && pass === "demo") ||
    (cleanEmail === "admin" && pass === "admin")
  ) {
    localStorage.setItem(
      "manager_session",
      JSON.stringify({
        email: cleanEmail === "demo" ? configuredEmail : cleanEmail,
        role: "manager",
        loggedInAt: new Date().toISOString(),
      }),
    );
    return { success: true };
  }
  return { success: false, message: "Sai tài khoản hoặc mật khẩu." };
}

export function logoutManager(): void {
  localStorage.removeItem("manager_session");
}

// ==========================================
// ORDERS & POINTS MANAGEMENT
// ==========================================
export async function getOrders(): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.map(formatOrderRecord);
}

export async function getCustomerOrders(
  customerIdOrPhone?: string | null,
  phoneFallback?: string | null,
): Promise<OrderRecord[]> {
  const conditions: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const checkAndAdd = (val?: string | null) => {
    if (!val || !val.trim()) return;
    const clean = val.trim();
    if (uuidRegex.test(clean)) {
      conditions.push(`customer_id.eq.${clean}`);
    } else {
      const formatted = normalizeVietnamesePhone(clean);
      conditions.push(`customer_phone.eq.${clean}`);
      if (formatted !== clean) {
        conditions.push(`customer_phone.eq.${formatted}`);
      }
    }
  };

  checkAndAdd(customerIdOrPhone);
  checkAndAdd(phoneFallback);

  if (conditions.length === 0) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .or(conditions.join(","))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading customer orders:", error);
    return [];
  }
  return (data || []).map(formatOrderRecord);
}

export async function submitOrder(
  orderData: {
    customerName: string;
    customerPhone: string;
    fulfillment: "Pickup" | "Delivery";
    address?: string;
    note?: string;
    items: CartItem[];
    totalAmount: number;
  },
  profileId?: string | null,
): Promise<OrderRecord> {
  let resolvedCustomerId = profileId || null;

  if (!resolvedCustomerId && orderData.customerPhone) {
    const raw = orderData.customerPhone.trim();
    const formatted = normalizeVietnamesePhone(raw);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`phone.eq.${raw},phone.eq.${formatted}`)
      .maybeSingle();
    if (profile?.id) {
      resolvedCustomerId = profile.id;
    }
  }

  const orderCode = generateOrderCode();

  const newOrder = {
    order_code: orderCode,
    customer_id: resolvedCustomerId,
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone,
    fulfillment: orderData.fulfillment,
    address: orderData.address,
    note: orderData.note,
    items: orderData.items,
    total_amount: orderData.totalAmount,
    status: "pending",
    points_awarded: 0,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(newOrder)
    .select()
    .single();

  if (error) throw error;
  
  if (resolvedCustomerId) {
    await supabase.from("profiles").update({ last_order_at: new Date().toISOString() }).eq("id", resolvedCustomerId);
  }

  return formatOrderRecord(data);
}

export async function confirmOrderAndAwardPoints(
  orderId: string,
  customPoints?: number,
): Promise<{ success: boolean; pointsAwarded: number; message: string }> {
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { success: false, pointsAwarded: 0, message: "Không tìm thấy đơn." };
  if (order.status === "confirmed") return { success: false, pointsAwarded: order.points_awarded, message: "Đã xác nhận." };

  const drinkCount = order.items
    .filter((it: any) => it.category === "matcha" || it.category === "coffee")
    .reduce((sum: number, it: any) => sum + it.quantity, 0);

  const pointsToAward = customPoints !== undefined ? customPoints : Math.max(1, drinkCount > 0 ? drinkCount : 1);

  await supabase.from("orders").update({
    status: "confirmed",
    points_awarded: pointsToAward,
    confirmed_at: new Date().toISOString(),
    confirmed_by: getManagerSession()?.email || "Manager"
  }).eq("id", orderId);

  // Update Profile
  const formattedPhone = normalizeVietnamesePhone(order.customer_phone);
  let { data: profile } = order.customer_id 
    ? await supabase.from("profiles").select("*").eq("id", order.customer_id).single()
    : await supabase.from("profiles").select("*").eq("phone", formattedPhone).single();

  if (profile) {
    const currentPoints = Number(profile.loyalty_points) || 0;
    const newPoints = currentPoints + pointsToAward;

    const { error: updateProfileError } = await supabase.from("profiles").update({
      loyalty_points: newPoints,
      last_order_at: order.created_at
    }).eq("id", profile.id);

    if (updateProfileError) {
      console.error("Failed to update profile loyalty points:", updateProfileError);
    }
    
    // Insert Transaction
    await supabase.from("loyalty_transactions").insert({
      profile_id: profile.id,
      order_id: order.id,
      order_code: order.order_code,
      points_change: pointsToAward,
      balance_after: newPoints,
      reason: `Xác nhận đơn hàng #${order.order_code} (+${pointsToAward} điểm)`
    });
  }

  return {
    success: true,
    pointsAwarded: pointsToAward,
    message: `Đã xác nhận #${order.order_code}, cộng +${pointsToAward} điểm!`
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ success: boolean }> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  return { success: !error };
}

export async function getAllCustomers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return [];

  // Also query loyalty_transactions to ensure manager sees the true accumulated points
  const { data: allTxs } = await supabase.from("loyalty_transactions").select("profile_id, points_change");
  const pointsMap = new Map<string, number>();
  if (allTxs) {
    for (const tx of allTxs) {
      pointsMap.set(tx.profile_id, (pointsMap.get(tx.profile_id) || 0) + Number(tx.points_change || 0));
    }
  }

  return data.map((p) => {
    const txTotal = pointsMap.get(p.id);
    const resolvedPoints = txTotal !== undefined ? Math.max(p.loyalty_points || 0, txTotal) : (p.loyalty_points || 0);
    return {
      ...formatProfileRecord(p),
      loyaltyPoints: resolvedPoints,
    };
  });
}

export async function getLoyaltyTransactions(profileId?: string): Promise<LoyaltyTransaction[]> {
  let query = supabase.from("loyalty_transactions").select("*").order("created_at", { ascending: false });
  if (profileId) query = query.eq("profile_id", profileId);
  const { data, error } = await query;
  if (error) return [];
  return data.map((t) => ({
    id: t.id,
    profileId: t.profile_id,
    orderId: t.order_id,
    orderCode: t.order_code,
    pointsChange: t.points_change,
    balanceAfter: t.balance_after,
    reason: t.reason,
    createdAt: t.created_at
  }));
}

export async function manualAdjustPoints(
  profileId: string,
  delta: number,
  reason: string,
): Promise<{ success: boolean; newBalance: number }> {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", profileId).single();
  if (!profile) return { success: false, newBalance: 0 };
  
  const newBalance = Math.max(0, profile.loyalty_points + delta);
  await supabase.from("profiles").update({ loyalty_points: newBalance }).eq("id", profileId);
  
  await supabase.from("loyalty_transactions").insert({
    profile_id: profileId,
    points_change: delta,
    balance_after: newBalance,
    reason: reason || "Điều chỉnh bởi Quản lý"
  });

  return { success: true, newBalance };
}

// Helpers to format snake_case DB to camelCase Frontend
function formatOrderRecord(dbRecord: any): OrderRecord {
  return {
    id: dbRecord.id,
    orderCode: dbRecord.order_code,
    customerId: dbRecord.customer_id,
    customerName: dbRecord.customer_name,
    customerPhone: dbRecord.customer_phone,
    fulfillment: dbRecord.fulfillment,
    address: dbRecord.address,
    note: dbRecord.note,
    items: dbRecord.items,
    totalAmount: dbRecord.total_amount,
    status: dbRecord.status,
    pointsAwarded: dbRecord.points_awarded,
    confirmedAt: dbRecord.confirmed_at,
    confirmedBy: dbRecord.confirmed_by,
    createdAt: dbRecord.created_at,
  };
}

function formatProfileRecord(dbRecord: any): UserProfile {
  return {
    id: dbRecord.id,
    phone: dbRecord.phone,
    name: dbRecord.name,
    role: dbRecord.role,
    loyaltyPoints: dbRecord.loyalty_points,
    preferences: dbRecord.preferences,
    createdAt: dbRecord.created_at,
    lastOrderAt: dbRecord.last_order_at,
  };
}
export const SUPABASE_SQL_SCHEMA = `
-- MIGRATION SCRIPT (Run this in Supabase SQL Editor if you already created tables):
-- 1. Decouple profiles from auth.users:
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add column if not exists preferences text;

-- 2. Allow guest/customer profile creation & lookup:
create policy if not exists "Allow insert customer profiles" on public.profiles for insert with check (true);
create policy if not exists "Allow select customer profiles" on public.profiles for select using (true);
create policy if not exists "Allow update customer profiles" on public.profiles for update using (true);

-- FULL SCHEMA (If creating from scratch):
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  name text,
  address text,
  preferences text,
  role text default 'customer' check (role in ('customer', 'manager', 'admin')),
  loyalty_points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_code text unique not null,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('Pickup', 'Delivery')),
  address text,
  note text,
  items jsonb not null,
  total_amount integer not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  points_awarded integer default 0,
  confirmed_at timestamptz,
  confirmed_by text,
  created_at timestamptz default now()
);

create table if not exists public.loyalty_transactions (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  order_code text,
  points_change integer not null,
  balance_after integer not null,
  reason text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.loyalty_transactions enable row level security;

create policy "Allow all select profiles" on public.profiles for select using (true);
create policy "Allow all insert profiles" on public.profiles for insert with check (true);
create policy "Allow all update profiles" on public.profiles for update using (true);

create policy "Allow all select orders" on public.orders for select using (true);
create policy "Allow all insert orders" on public.orders for insert with check (true);
create policy "Allow all update orders" on public.orders for update using (true);

create policy "Allow all select transactions" on public.loyalty_transactions for select using (true);
create policy "Allow all insert transactions" on public.loyalty_transactions for insert with check (true);
`;
