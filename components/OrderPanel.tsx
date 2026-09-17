import { useEffect, useState } from "react";
import type { CartItem, CustomerInfo } from "../types/menu";
import type { ValidationErrors } from "../lib/validation";
import type { LoyaltyOrderMeta } from "../lib/formatters";
import type { UserProfile } from "../types/loyalty";
import { compactMoney, money } from "../lib/formatters";
import { checkCustomerByPhone } from "../lib/supabase";

type OrderPanelProps = {
  cart: CartItem[];
  customer: CustomerInfo;
  onUpdateCustomer: (field: keyof CustomerInfo, value: string) => void;
  onUpdateQuantity: (key: string, delta: 1 | -1) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  copyStatus: string;
  onCopyOrder: () => Promise<boolean>;
  onSendToFacebook: () => Promise<void>;
  orderText: string;
  validationErrors: ValidationErrors;
  loyaltyInfo: LoyaltyOrderMeta;
  onUpdateLoyaltyInfo: (info: LoyaltyOrderMeta) => void;
  onUpdatePreferences?: (pref: string) => void;
};

export function OrderPanel({
  cart,
  customer,
  onUpdateCustomer,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  copyStatus,
  onCopyOrder,
  onSendToFacebook,
  orderText,
  validationErrors,
  loyaltyInfo,
  onUpdateLoyaltyInfo,
  onUpdatePreferences,
}: OrderPanelProps) {
  const [wantsMembership, setWantsMembership] = useState(loyaltyInfo?.optedIn ?? true);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [preferences, setPreferences] = useState("");

  // Check phone in Supabase whenever customer.phone changes
  useEffect(() => {
    const rawPhone = customer.phone.trim();
    if (!rawPhone || rawPhone.length < 9) {
      setExistingProfile(null);
      onUpdateLoyaltyInfo({
        optedIn: wantsMembership,
        isNewMember: true,
        phone: rawPhone,
      });
      return;
    }

    let isMounted = true;
    setIsCheckingPhone(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkCustomerByPhone(rawPhone);
        if (!isMounted) return;
        setIsCheckingPhone(false);
        if (res.exists && res.profile) {
          setExistingProfile(res.profile);
          if (res.profile.preferences && !preferences) {
            setPreferences(res.profile.preferences);
            onUpdatePreferences?.(res.profile.preferences);
          }
          onUpdateLoyaltyInfo({
            optedIn: wantsMembership,
            isNewMember: false,
            phone: rawPhone,
          });
        } else {
          setExistingProfile(null);
          onUpdateLoyaltyInfo({
            optedIn: wantsMembership,
            isNewMember: true,
            phone: rawPhone,
          });
        }
      } catch {
        if (isMounted) setIsCheckingPhone(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [customer.phone, wantsMembership]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => {
    const extras = item.extras.reduce(
      (extraSum, extra) => extraSum + extra.price,
      0,
    );
    return sum + (item.price + extras) * item.quantity;
  }, 0);

  return (
    <aside className="order-panel" id="order" aria-label="Khung đặt món">
      <div className="panel-section cart-section">
        <div className="cart-heading">
          <div>
            <h2>Giỏ hàng</h2>
            <span className="cart-count-badge">{itemCount} món</span>
          </div>
          {cart.length > 0 ? (
            <button
              className="clear-cart-btn"
              onClick={onClearCart}
              type="button"
            >
              Xóa tất cả
            </button>
          ) : null}
        </div>

        {validationErrors.cart ? (
          <p className="field-error-notice">{validationErrors.cart}</p>
        ) : null}

        <div className="cart-list">
          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <p>Chưa có món nào trong giỏ.</p>
              <small>
                Chọn một ly matcha, bánh ngọt hoặc cà phê từ menu bên trái nhé!
              </small>
            </div>
          ) : (
            cart.map((cartItem) => {
              const extrasPrice = cartItem.extras.reduce(
                (sum, extra) => sum + extra.price,
                0,
              );
              const itemSubtotal =
                (cartItem.price + extrasPrice) * cartItem.quantity;

              const details = [
                cartItem.matcha,
                cartItem.sweetness,
                cartItem.ice,
                ...cartItem.extras.map((extra) => `+${extra.name}`),
              ].filter(Boolean);

              return (
                <article className="cart-item" key={cartItem.key}>
                  <div className="cart-item-info">
                    <h3>
                      {cartItem.name}
                      {cartItem.size ? (
                        <span className="item-size-tag">
                          Size {cartItem.size}
                        </span>
                      ) : null}
                    </h3>
                    {details.length > 0 ? (
                      <p className="cart-item-details">
                        {details.join(" • ")}
                      </p>
                    ) : (
                      <p className="cart-item-english">{cartItem.english}</p>
                    )}
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        aria-label={`Giảm số lượng ${cartItem.name}`}
                        onClick={() => onUpdateQuantity(cartItem.key, -1)}
                        type="button"
                      >
                        -
                      </button>
                      <span>{cartItem.quantity}</span>
                      <button
                        aria-label={`Tăng số lượng ${cartItem.name}`}
                        onClick={() => onUpdateQuantity(cartItem.key, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>

                    <strong>{compactMoney(itemSubtotal)}</strong>

                    <button
                      aria-label={`Xóa món ${cartItem.name}`}
                      className="item-delete-btn"
                      onClick={() => onRemoveItem(cartItem.key)}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-section customer-form">
        <h3 className="section-subtitle">Thông tin nhận hàng</h3>

        <label htmlFor="customer-name">
          <span className="field-title">
            Họ và tên <b className="req-star">*</b>
          </span>
          <input
            id="customer-name"
            className={validationErrors.name ? "input-invalid" : ""}
            onChange={(event) => onUpdateCustomer("name", event.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            value={customer.name}
          />
          {validationErrors.name ? (
            <span className="field-error-text">{validationErrors.name}</span>
          ) : null}
        </label>

        <label htmlFor="customer-phone">
          <span className="field-title">
            Số điện thoại <b className="req-star">*</b>
          </span>
          <input
            id="customer-phone"
            className={validationErrors.phone ? "input-invalid" : ""}
            onChange={(event) => onUpdateCustomer("phone", event.target.value)}
            placeholder="Ví dụ: 0901234567"
            type="tel"
            value={customer.phone}
          />
          {validationErrors.phone ? (
            <span className="field-error-text">{validationErrors.phone}</span>
          ) : null}
        </label>

        <div className="fulfillment-wrapper">
          <span className="field-title">Phương thức nhận món</span>
          <div
            className="fulfillment"
            role="group"
            aria-label="Chọn phương thức nhận món"
          >
            {(["Pickup", "Delivery"] as const).map((choice) => (
              <button
                className={customer.fulfillment === choice ? "selected" : ""}
                key={choice}
                onClick={() => onUpdateCustomer("fulfillment", choice)}
                type="button"
              >
                {choice === "Pickup"
                  ? "Mang đi (Pickup)"
                  : "Giao hàng (Delivery)"}
              </button>
            ))}
          </div>
        </div>

        {customer.fulfillment === "Delivery" ? (
          <label htmlFor="customer-address">
            <span className="field-title">
              Địa chỉ nhận hàng <b className="req-star">*</b>
            </span>
            <input
              id="customer-address"
              className={validationErrors.address ? "input-invalid" : ""}
              onChange={(event) =>
                onUpdateCustomer("address", event.target.value)
              }
              placeholder="Số nhà, tên đường, phường/xã..."
              value={customer.address}
            />
            {validationErrors.address ? (
              <span className="field-error-text">{validationErrors.address}</span>
            ) : null}
          </label>
        ) : null}

        <label htmlFor="customer-note">
          <span className="field-title">Ghi chú cho quán</span>
          <textarea
            id="customer-note"
            onChange={(event) => onUpdateCustomer("note", event.target.value)}
            placeholder="Ví dụ: Giao trước 3h, mang thêm ống hút giấy..."
            value={customer.note}
          />
        </label>

        {/* Membership Loyalty Registration Section */}
        <div className="membership-box">
          <div className="membership-toggle-row">
            <label className="membership-checkbox-label">
              <input
                type="checkbox"
                checked={wantsMembership}
                onChange={(e) => {
                  const val = e.target.checked;
                  setWantsMembership(val);
                  onUpdateLoyaltyInfo({
                    optedIn: val,
                    isNewMember: !existingProfile,
                    phone: customer.phone.trim(),
                  });
                }}
              />
              <span className="membership-title">
                🌿 Đăng ký / Tích điểm thành viên Matchaholic
              </span>
            </label>
          </div>

          {wantsMembership && (
            <div className="membership-details-card">
              {isCheckingPhone ? (
                <p className="membership-hint">⏳ Đang kiểm tra số điện thoại...</p>
              ) : existingProfile ? (
                <div className="existing-member-alert">
                  <strong>🎉 Chào mừng bạn quay lại, {existingProfile.name || "Khách quen"}!</strong>
                  <p>
                    Số dư hiện tại: ⭐ <b>{existingProfile.loyaltyPoints}</b> điểm. Đơn hàng này sẽ được tích điểm tự động khi quán xác nhận qua Messenger.
                  </p>
                </div>
              ) : (
                <div className="new-member-fields">
                  <span className="new-member-tag">✨ Đăng ký thành viên mới</span>
                  <p className="membership-hint">
                    Điểm thưởng sẽ được tích tự động cho số điện thoại <b>{customer.phone || "(nhập ở trên)"}</b> khi quán xác nhận qua Messenger.
                  </p>
                  <label className="membership-pref-label">
                    <span>Sở thích / Khẩu vị quen thuộc (Tùy chọn)</span>
                    <input
                      type="text"
                      value={preferences}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPreferences(val);
                        onUpdatePreferences?.(val);
                      }}
                      placeholder="Ví dụ: Thích ít ngọt, nhiều matcha, thích kem mặn..."
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="checkout">
        <div className="checkout-total-row">
          <span>Tổng thanh toán</span>
          <strong>{money(total)}</strong>
        </div>

        <button
          className="send-button"
          onClick={onSendToFacebook}
          type="button"
        >
          <span>Gửi đơn qua Facebook Messenger 💬</span>
        </button>

        <button
          className="copy-button"
          onClick={() => {
            void onCopyOrder();
          }}
          type="button"
        >
          📋 Sao chép đơn hàng
        </button>

        {copyStatus ? (
          <p className="copy-status-message" aria-live="polite">
            {copyStatus}
          </p>
        ) : null}

        <details className="order-preview-details">
          <summary>Xem chi tiết nội dung đơn hàng</summary>
          <textarea
            readOnly
            value={orderText}
            aria-label="Nội dung đơn hàng dạng văn bản"
          />
        </details>
      </div>
    </aside>
  );
}
