import type { Category } from "../types/menu";

export function ProductArt({
  accent,
  category,
}: {
  accent: string;
  category: Category;
}) {
  return (
    <div className={`product-art ${accent}`} aria-hidden="true">
      {category === "pastry" ? (
        <span className="croissant">
          <i />
        </span>
      ) : category === "coffee" ? (
        <span className="coffee-cup">
          <i />
        </span>
      ) : (
        <>
          <span className="cup">
            <i />
          </span>
          <span className="carton">
            <i />
          </span>
        </>
      )}
    </div>
  );
}
