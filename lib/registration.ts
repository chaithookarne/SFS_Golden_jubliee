// lib/registration.ts

export type ParkingNeeded = '2-wheeler' | '4-wheeler' | 'none';

export type CostCalculationInput = {
  numberOfGuests: number;
  lunch: boolean;
  dinner: boolean;
  parkingNeeded: ParkingNeeded;
  foodPreference?: 'veg' | 'non-veg';
};

export type EventPricing = {
  lunch_paise: number;
  dinner_paise: number;
  /** Absent means non-veg lunch uses the veg lunch rate. */
  lunch_nonveg_paise?: number | null;
  /** Absent means non-veg dinner uses the veg dinner rate. */
  dinner_nonveg_paise?: number | null;
  parking_2w_paise: number;
  parking_4w_paise: number;
  base_ticket_paise: number;
};

function mealRatePaise(pricing: EventPricing, meal: 'lunch' | 'dinner', foodPreference?: string): number {
  const veg = meal === 'lunch' ? pricing.lunch_paise || 0 : pricing.dinner_paise || 0;
  if (foodPreference !== 'non-veg') return veg;
  const nonveg = meal === 'lunch' ? pricing.lunch_nonveg_paise : pricing.dinner_nonveg_paise;
  if (nonveg == null || !Number.isFinite(Number(nonveg))) return veg;
  return Math.max(0, Number(nonveg));
}

/** @deprecated Prefer event catalog rates; kept for interim call sites. */
export const DEFAULT_JUBILEE_PRICING: EventPricing = {
  lunch_paise: 30000,
  dinner_paise: 50000,
  parking_2w_paise: 5000,
  parking_4w_paise: 20000,
  base_ticket_paise: 0,
};

export function calculateEventRegistrationCost(
  pricing: EventPricing,
  input: CostCalculationInput
): number {
  return getEventCostBreakdown(pricing, input).totalCost;
}

/** People attending, including the alumnus. Blank or zero still counts as one person. */
export function partySize(numberOfGuests: number): number {
  const n = Math.floor(Number(numberOfGuests));
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function getEventCostBreakdown(
  pricing: EventPricing,
  input: CostCalculationInput
): {
  mealCost: number;
  parkingCost: number;
  baseCost: number;
  totalCost: number;
  details: string;
} {
  const totalPeople = partySize(input.numberOfGuests);
  let mealCost = 0;
  const mealBits: string[] = [];

  const diet = input.foodPreference === 'non-veg' ? 'non-veg' : 'veg';
  if (input.lunch) {
    const rate = mealRatePaise(pricing, 'lunch', input.foodPreference);
    mealCost += totalPeople * rate;
    mealBits.push(`Lunch ${diet} ₹${(rate / 100).toFixed(0)}`);
  }
  if (input.dinner) {
    const rate = mealRatePaise(pricing, 'dinner', input.foodPreference);
    mealCost += totalPeople * rate;
    mealBits.push(`Dinner ${diet} ₹${(rate / 100).toFixed(0)}`);
  }

  const parkingCost =
    input.parkingNeeded === '2-wheeler'
      ? pricing.parking_2w_paise || 0
      : input.parkingNeeded === '4-wheeler'
        ? pricing.parking_4w_paise || 0
        : 0;

  const baseCost = pricing.base_ticket_paise || 0;

  let details =
    mealBits.length > 0
      ? `${totalPeople} person(s) × (${mealBits.join(' + ')})`
      : `${totalPeople} person(s) × No meals`;
  if (parkingCost > 0) {
    details += ` + parking ₹${(parkingCost / 100).toFixed(0)}`;
  }
  if (baseCost > 0) {
    details += ` + base ₹${(baseCost / 100).toFixed(0)}`;
  }

  return {
    mealCost,
    parkingCost,
    baseCost,
    totalCost: mealCost + parkingCost + baseCost,
    details,
  };
}

/** Legacy wrapper using Jubilee defaults. */
export function calculateRegistrationCost(input: CostCalculationInput): number {
  return calculateEventRegistrationCost(DEFAULT_JUBILEE_PRICING, input);
}

export function getCostBreakdown(input: CostCalculationInput) {
  const b = getEventCostBreakdown(DEFAULT_JUBILEE_PRICING, input);
  return {
    mealCost: b.mealCost,
    parkingCost: b.parkingCost,
    totalCost: b.totalCost,
    details: b.details,
  };
}

export function formatCostForDisplay(costInPaise: number): string {
  const rupees = costInPaise / 100;
  return `₹${rupees.toFixed(2)}`;
}

export function validateRegistrationCost(
  pricingOrInput: EventPricing | CostCalculationInput,
  maybeInput?: CostCalculationInput
): boolean {
  const pricing = maybeInput ? (pricingOrInput as EventPricing) : DEFAULT_JUBILEE_PRICING;
  const input = maybeInput ?? (pricingOrInput as CostCalculationInput);
  const hasMeal = input.lunch || input.dinner;
  const hasParking = input.parkingNeeded !== 'none';
  const hasBase = (pricing.base_ticket_paise || 0) > 0;
  return hasMeal || hasParking || hasBase;
}
