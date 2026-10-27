import { missingColumn } from '@/lib/events/registration-code';
import { EVENT_SELECT } from '@/lib/events/types';

export const EVENT_SELECT_DIET = `${EVENT_SELECT},lunch_nonveg_paise,dinner_nonveg_paise`;

type CatalogError = { code?: string; message?: string } | null;
type CatalogResult<T> = { data: T; error: CatalogError };

/** Reads the catalog with veg/non-veg rates, and without them when those columns are not migrated yet. */
export async function selectCatalog<T>(
  run: (columns: string) => PromiseLike<CatalogResult<T>>
): Promise<CatalogResult<T>> {
  const full = await run(EVENT_SELECT_DIET);
  if (full.error && missingColumn(full.error)) return run(EVENT_SELECT);
  return full;
}

export function withoutDietPrices<T extends Record<string, unknown>>(row: T): T {
  const next = { ...row };
  delete next.lunch_nonveg_paise;
  delete next.dinner_nonveg_paise;
  return next;
}

export const DIET_PRICE_WARNING =
  'The event was saved. Veg and non-veg prices are not stored yet — run the meal diet price migration in Supabase, then save the event again.';
