import type { MenuItem, Size } from "../types/menu";
import { compactMoney } from "../lib/formatters";
import { ProductArt } from "./ProductArt";

export function DrinkCard({
  product,
  onCustomize,
}: {
  product: MenuItem;
  onCustomize: (product: MenuItem, defaultSize?: Size) => void;
}) {
  return (
    <article className={`product-card ${product.accent}`}>
      <ProductArt accent={product.accent} category={product.category} />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.english}</p>
      </div>

      <div className="price-row" aria-label={`${product.name} prices`}>
        {product.prices.M ? (
          <button
            onClick={() => onCustomize(product, "M")}
            type="button"
            aria-label={`Chọn size M giá ${compactMoney(product.prices.M)}`}
          >
            <span>M</span>
            {compactMoney(product.prices.M)}
          </button>
        ) : null}
        {product.prices.L ? (
          <button
            onClick={() => onCustomize(product, "L")}
            type="button"
            aria-label={`Chọn size L giá ${compactMoney(product.prices.L)}`}
          >
            <span>L</span>
            {compactMoney(product.prices.L)}
          </button>
        ) : null}
      </div>

      {product.extras && product.extras.length > 0 ? (
        <p className="extras-line">
          Extra{" "}
          {product.extras
            .map((extra) => `${extra.name} +${extra.price}k`)
            .join(" / ")}
        </p>
      ) : (
        <p className="extras-line">Hương vị thanh mát tự nhiên</p>
      )}

      <button
        className="customize-card-btn"
        onClick={() => onCustomize(product, "M")}
        type="button"
      >
        Tùy chỉnh &amp; Thêm
      </button>
    </article>
  );
}
