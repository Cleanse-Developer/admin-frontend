export function formatPrice(amount) {
  return `Rs.${Number(amount).toLocaleString("en-IN")}`;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
