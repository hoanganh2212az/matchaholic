import type { CartItem, CustomerInfo } from "../types/menu";

export function money(value: number): string {
  return `${value}.000 VND`;
}

export function compactMoney(value: number): string {
  return `${value}k`;
}

export interface LoyaltyOrderMeta {
  optedIn: boolean;
  isNewMember?: boolean;
  phone?: string;
}

export function generateOrderText(
  customer: CustomerInfo,
  cart: CartItem[],
  total: number,
  orderCode?: string,
  loyaltyInfo?: LoyaltyOrderMeta,
): string {
  const lines = [
    orderCode
      ? `Matcha.holic order #${orderCode}`
      : "Matcha.holic order",
    orderCode ? "⭐️ Xác nhận đơn để tích điểm thưởng!" : "",
    "",
  ].filter(Boolean);

  if (customer.name.trim()) lines.push(`Name: ${customer.name.trim()}`);
  if (customer.phone.trim()) lines.push(`Phone: ${customer.phone.trim()}`);
  lines.push(`Method: ${customer.fulfillment}`);
  if (customer.fulfillment === "Delivery" && customer.address.trim()) {
    lines.push(`Address: ${customer.address.trim()}`);
  }
  if (customer.note.trim()) lines.push(`Note: ${customer.note.trim()}`);
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
        cartItem.sweetness,
        cartItem.ice,
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

  if (loyaltyInfo?.optedIn) {
    const targetPhone = loyaltyInfo.phone || customer.phone.trim();
    lines.push("");
    if (loyaltyInfo.isNewMember) {
      lines.push(
        `Mình muốn đăng kí tích điểm, bạn kích hoạt cho số điện thoại: ${targetPhone} nha. Hẹn gặp Matchaholic lần tiếp theo!`,
      );
    } else {
      lines.push(`⭐️ Khách hàng thân thiết: Tích điểm cho SĐT ${targetPhone}`);
    }
  }

  return lines.join("\n");
}
