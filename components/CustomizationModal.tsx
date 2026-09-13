import { useEffect, useState } from "react";
import type { Extra, MenuItem, Size } from "../types/menu";
import {
  ICE_CHOICES,
  MATCHA_CHOICES,
  SWEETNESS_CHOICES,
  TOPPINGS,
} from "../data/menu";
import { compactMoney, money } from "../lib/formatters";

type CustomizationModalProps = {
  product: MenuItem | null;
  defaultSize?: Size;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    product: MenuItem;
    size: Size;
    matcha: string;
    sweetness: string;
    ice: string;
    extras: Extra[];
    quantity: number;
  }) => void;
};

export function CustomizationModal({
  product,
  defaultSize = "M",
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const [size, setSize] = useState<Size>(defaultSize);
  const [matcha, setMatcha] = useState<string>(MATCHA_CHOICES[0]);
  const [sweetness, setSweetness] = useState<string>(SWEETNESS_CHOICES[0]);
  const [ice, setIce] = useState<string>(ICE_CHOICES[0]);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const basePrice = product.prices[size] ?? product.prices.M ?? 0;
  const extrasTotal = selectedExtras.reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const itemTotal = (basePrice + extrasTotal) * quantity;

  // Combine product-specific extras and toppings (avoid duplicates by ID)
  const availableExtras: Extra[] = [
    ...(product.extras ?? []),
    ...TOPPINGS,
  ].filter(
    (extra, index, array) =>
      array.findIndex((t) => t.id === extra.id) === index,
  );

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra],
    );
  }

  function handleConfirm() {
    if (!product) return;
    onAddToCart({
      product,
      size,
      matcha: product.category === "matcha" ? matcha : "",
      sweetness: product.category === "matcha" ? sweetness : "",
      ice: product.category === "matcha" ? ice : "",
      extras: selectedExtras,
      quantity,
    });
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{product.name}</h2>
            <p className="modal-subtitle">{product.english}</p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Size selection */}
          {product.prices.L ? (
            <div className="modal-section">
              <div className="section-label">
                <span>Chọn kích cỡ (Size)</span>
                <span className="required-tag">Bắt buộc</span>
              </div>
              <div className="choice-grid two-cols">
                <button
                  className={`choice-btn ${size === "M" ? "active" : ""}`}
                  onClick={() => setSize("M")}
                  type="button"
                >
                  <b>Size M</b>
                  <span>{compactMoney(product.prices.M ?? 0)}</span>
                </button>
                <button
                  className={`choice-btn ${size === "L" ? "active" : ""}`}
                  onClick={() => setSize("L")}
                  type="button"
                >
                  <b>Size L</b>
                  <span>{compactMoney(product.prices.L ?? 0)}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Matcha Grade Selection (only for matcha drinks) */}
          {product.category === "matcha" ? (
            <>
              <div className="modal-section">
                <div className="section-label">
                  <span>Loại Matcha</span>
                  <span className="required-tag">Bắt buộc</span>
                </div>
                <div className="choice-grid single-col">
                  {MATCHA_CHOICES.map((choice) => (
                    <button
                      className={`choice-btn ${matcha === choice ? "active" : ""}`}
                      key={choice}
                      onClick={() => setMatcha(choice)}
                      type="button"
                    >
                      <b>{choice}</b>
                      <span>
                        {choice === "Matcha Satoen"
                          ? "Chuẩn vị"
                          : choice === "Matcha Special Mix"
                            ? "Đậm đà"
                            : "Cao cấp"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness */}
              <div className="modal-section">
                <div className="section-label">
                  <span>Mức đường (Sweetness)</span>
                </div>
                <div className="pill-grid">
                  {SWEETNESS_CHOICES.map((choice) => (
                    <button
                      className={`pill-btn ${sweetness === choice ? "active" : ""}`}
                      key={choice}
                      onClick={() => setSweetness(choice)}
                      type="button"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice level */}
              <div className="modal-section">
                <div className="section-label">
                  <span>Lượng đá (Ice)</span>
                </div>
                <div className="pill-grid">
                  {ICE_CHOICES.map((choice) => (
                    <button
                      className={`pill-btn ${ice === choice ? "active" : ""}`}
                      key={choice}
                      onClick={() => setIce(choice)}
                      type="button"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* Toppings & Extras */}
          {availableExtras.length > 0 ? (
            <div className="modal-section">
              <div className="section-label">
                <span>Topping &amp; Thêm</span>
                <span className="optional-tag">Tùy chọn</span>
              </div>
              <div className="check-list">
                {availableExtras.map((extra) => {
                  const isChecked = selectedExtras.some(
                    (e) => e.id === extra.id,
                  );
                  const inputId = `modal-extra-${extra.id}`;
                  return (
                    <label
                      key={extra.id}
                      htmlFor={inputId}
                      className="extra-checkbox-label"
                    >
                      <input
                        id={inputId}
                        checked={isChecked}
                        onChange={() => toggleExtra(extra)}
                        type="checkbox"
                      />
                      <span>{extra.name}</span>
                      <b>+{extra.price}k</b>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer: Quantity & Add Button */}
        <div className="modal-footer">
          <div className="modal-quantity">
            <button
              aria-label="Giảm số lượng"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              type="button"
            >
              -
            </button>
            <span>{quantity}</span>
            <button
              aria-label="Tăng số lượng"
              onClick={() => setQuantity((q) => q + 1)}
              type="button"
            >
              +
            </button>
          </div>

          <button
            className="modal-add-btn"
            onClick={handleConfirm}
            type="button"
          >
            Thêm vào giỏ • {money(itemTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
