/**
 * Multi-currency normalization for financial reporting.
 *
 * The problem this solves: revenue is usually invoiced in USD while operating expenses
 * (fuel, park fees, driver allowances) are paid in TZS. Subtracting one from the other
 * directly produces a meaningless number. Everything is normalized to a single base
 * currency before any arithmetic.
 *
 * Rate source: TZS_PER_USD env var, refreshed manually. A live FX API can be swapped in
 * behind getRate() without touching callers — but a fixed, explicitly-set rate is
 * deliberately the default, because a silently-changing rate makes historical reports
 * irreproducible. Payments and expenses should ideally store the rate at transaction time
 * (the Invoice model already has exchangeRateToUSD for this).
 */

export type SupportedCurrency = "TZS" | "USD";

const DEFAULT_TZS_PER_USD = 2600; // fallback only; set TZS_PER_USD in env

export function getTzsPerUsd(): number {
  const fromEnv = Number(process.env.TZS_PER_USD);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_TZS_PER_USD;
}

/** Convert an amount from one supported currency to another. */
export function convert(amount: number, from: SupportedCurrency, to: SupportedCurrency, rate = getTzsPerUsd()): number {
  if (from === to) return amount;
  if (from === "TZS" && to === "USD") return amount / rate;
  if (from === "USD" && to === "TZS") return amount * rate;
  return amount;
}

interface MoneyRow {
  amount: unknown; // Prisma Decimal, string, or number
  currency: string;
}

/** Sum a set of rows that may be in mixed currencies, normalized to `base`. */
export function sumInCurrency(rows: MoneyRow[], base: SupportedCurrency, rate = getTzsPerUsd()): number {
  return rows.reduce((total, row) => {
    const value = Number(row.amount);
    if (!Number.isFinite(value)) return total;
    return total + convert(value, row.currency as SupportedCurrency, base, rate);
  }, 0);
}

export function formatMoney(amount: number, currency: SupportedCurrency): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Compute per-trip profitability with all figures normalized to `base`.
 * Returns the rate used so the UI can disclose it — never present a converted
 * figure without showing which rate produced it.
 */
export function computeProfit(
  payments: MoneyRow[],
  expenses: MoneyRow[],
  base: SupportedCurrency
): { totalRevenue: number; totalExpenses: number; netProfit: number; rateUsed: number; base: SupportedCurrency } {
  const rate = getTzsPerUsd();
  const totalRevenue = sumInCurrency(payments, base, rate);
  const totalExpenses = sumInCurrency(expenses, base, rate);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    rateUsed: rate,
    base,
  };
}
