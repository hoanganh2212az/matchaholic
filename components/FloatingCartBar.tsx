import { money } from "../lib/formatters";

export function FloatingCartBar({
  itemCount,
  total,
  onOpenCart,
}: {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <aside
      className="floating-cart-bar"
      aria-label="Thanh giỏ hàng di động"
    >
      <div className="floating-cart-info">
        <span className="cart-badge-icon">
          🛒 <b>{itemCount}</b>
        </span>
        <div className="floating-cart-text">
          <span className="floating-cart-count">{itemCount} món</span>
          <span className="floating-cart-total">{money(total)}</span>
        </div>
      </div>

      <button
        className="floating-cart-action"
        onClick={onOpenCart}
        type="button"
      >
        Xem đơn hàng &rarr;
      </button>
    </aside>
  );
}
