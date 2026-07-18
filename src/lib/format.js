export function formatPrice(amount) {
  return `Rs.${Number(amount).toLocaleString("en-IN")}`;
}

// Effective display price for a product: the lowest positive variant price when
// the product is priced through `sizes[]`, else the base `price`. Mirrors the
// storefront's cardPrice so the admin list shows what a shopper actually pays,
// not the base placeholder (e.g. Rs.1) left on a variant-priced product.
export function effectivePrice(product) {
  const variantPrices = (product?.sizes || [])
    .map((s) => Number(s.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return variantPrices.length
    ? Math.min(...variantPrices)
    : Number(product?.price) || 0;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
