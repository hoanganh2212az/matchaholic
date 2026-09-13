import type { CartItem, CustomerInfo } from "../types/menu";

export type ValidationErrors = {
  name?: string;
  phone?: string;
  address?: string;
  cart?: string;
};

export function isValidVietnamesePhone(phone: string): boolean {
  const cleanPhone = phone.trim().replace(/[\s.-]/g, "");
  // Matches 10-digit standard VN phones (03x, 05x, 07x, 08x, 09x) or international (+84)
  const regex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return regex.test(cleanPhone);
}

export function validateOrder(
  customer: CustomerInfo,
  cart: CartItem[],
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  if (!cart || cart.length === 0) {
    errors.cart = "Vui lòng chọn ít nhất một món vào giỏ hàng.";
  }

  if (!customer.name.trim()) {
    errors.name = "Vui lòng nhập tên của bạn.";
  }

  if (!customer.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!isValidVietnamesePhone(customer.phone)) {
    errors.phone = "Số điện thoại không hợp lệ (ví dụ: 0901234567).";
  }

  if (customer.fulfillment === "Delivery" && !customer.address.trim()) {
    errors.address = "Vui lòng nhập địa chỉ giao hàng.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
