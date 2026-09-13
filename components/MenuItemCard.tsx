import type { MenuItem } from "../types/menu";
import { compactMoney } from "../lib/formatters";
import { ProductArt } from "./ProductArt";

export function PastryCard({
  product,
  onAdd,
}: {
  product: MenuItem;
  onAdd: (product: MenuItem) => void;
}) {
  return (
    <article className="simple-card">
      {product.badge ? <span className="badge">{product.badge}</span> : null}
      <ProductArt accent={product.accent} category={product.category} />
      <h3>{product.name}</h3>
      <p>{product.english}</p>
      <button onClick={() => onAdd(product)} type="button">
        Thêm {compactMoney(product.prices.M ?? 0)}
      </button>
    </article>
  );
}

export function CoffeeButton({
  product,
  onAdd,
}: {
  product: MenuItem;
  onAdd: (product: MenuItem) => void;
}) {
  return (
    <button
      className="coffee-button"
      onClick={() => onAdd(product)}
      type="button"
      aria-label={`Thêm ${product.name} ${compactMoney(product.prices.M ?? 29)}`}
    >
      <span>{product.name}</span>
      <small>{product.english} • {compactMoney(product.prices.M ?? 29)}</small>
    </button>
  );
}
