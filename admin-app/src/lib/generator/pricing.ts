export function parseOptionalPrice(rawValue: string): number | null | undefined {
  if (rawValue.trim() === "") {
    return null;
  }

  if (rawValue.trim().toLowerCase() === "free") {
    return 0;
  }

  const amount = Number(rawValue);
  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

export function formatDraftPrice(price: number | null | undefined): string {
  if (price === undefined || price === null) {
    return "Unset";
  }

  return price === 0 ? "Free" : `${price} DZD`;
}
