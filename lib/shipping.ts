export type ShippingConfig = {
  freeShippingThreshold: number;
  flatRate: number;
};

function parseNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getShippingConfig(): ShippingConfig {
  const freeShippingThreshold = parseNumber(
    process.env.SHIPPING_FREE_THRESHOLD ?? process.env.NEXT_PUBLIC_SHIPPING_FREE_THRESHOLD,
    499
  );
  const flatRate = parseNumber(
    process.env.SHIPPING_FLAT_RATE ?? process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE,
    80
  );

  return {
    freeShippingThreshold: Math.max(0, freeShippingThreshold),
    flatRate: Math.max(0, flatRate),
  };
}

export function calculateShipping(subtotal: number): number {
  const { freeShippingThreshold, flatRate } = getShippingConfig();
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  return safeSubtotal < freeShippingThreshold ? flatRate : 0;
}
