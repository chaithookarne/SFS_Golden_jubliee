import type { EventPricing } from '@/lib/registration';
import type { EventCatalog } from '@/lib/events/types';

export function eventToPricing(event: Pick<
  EventCatalog,
  'lunch_paise' | 'dinner_paise' | 'parking_2w_paise' | 'parking_4w_paise' | 'base_ticket_paise'
> & Partial<Pick<EventCatalog, 'lunch_nonveg_paise' | 'dinner_nonveg_paise'>>): EventPricing {
  return {
    lunch_paise: event.lunch_paise,
    dinner_paise: event.dinner_paise,
    lunch_nonveg_paise: event.lunch_nonveg_paise,
    dinner_nonveg_paise: event.dinner_nonveg_paise,
    parking_2w_paise: event.parking_2w_paise,
    parking_4w_paise: event.parking_4w_paise,
    base_ticket_paise: event.base_ticket_paise,
  };
}

function rupees(paise: number | null | undefined) {
  return ((paise || 0) / 100).toFixed(0);
}

/** One line of meal rates. Separate veg and non-veg figures appear only when they differ. */
export function mealPriceSummary(event: EventPricing): string {
  const lunchNon = event.lunch_nonveg_paise == null ? event.lunch_paise : event.lunch_nonveg_paise;
  const dinnerNon = event.dinner_nonveg_paise == null ? event.dinner_paise : event.dinner_nonveg_paise;
  const lunch =
    lunchNon === event.lunch_paise
      ? `Lunch ₹${rupees(event.lunch_paise)}`
      : `Lunch veg ₹${rupees(event.lunch_paise)} · non-veg ₹${rupees(lunchNon)}`;
  const dinner =
    dinnerNon === event.dinner_paise
      ? `Dinner ₹${rupees(event.dinner_paise)}`
      : `Dinner veg ₹${rupees(event.dinner_paise)} · non-veg ₹${rupees(dinnerNon)}`;
  return `${lunch} / person · ${dinner} / person`;
}

export function mealChoiceLabel(
  name: string,
  vegPaise: number,
  nonvegPaise: number | null | undefined,
  preference: 'veg' | 'non-veg'
): string {
  const rate = preference === 'non-veg' && nonvegPaise != null ? nonvegPaise : vegPaise;
  return `${name} · ₹${rupees(rate)} / person`;
}

export function parseNonNegInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

/** Convert rupees (form input) to paise. */
export function rupeesToPaise(rupees: unknown): number {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
