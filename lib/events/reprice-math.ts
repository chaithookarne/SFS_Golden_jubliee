import { amountDuePaise, statusFromAmounts } from './balance';
import {
  calculateEventRegistrationCost,
  normalizeFoodPreference,
  partySize,
  type EventPricing,
  type ParkingNeeded,
} from '../registration';

type RepriceRow = {
  number_of_guests: number;
  lunch: boolean;
  dinner: boolean;
  parking_needed: string;
  food_preference?: string | null;
  amount_paid_paise?: number | null;
};

export function repriceRegistration(pricing: EventPricing, row: RepriceRow) {
  const parkingNeeded = (
    ['none', '2-wheeler', '4-wheeler'].includes(row.parking_needed) ? row.parking_needed : 'none'
  ) as ParkingNeeded;
  const total_cost_paise = calculateEventRegistrationCost(pricing, {
    numberOfGuests: partySize(Number(row.number_of_guests)),
    lunch: Boolean(row.lunch),
    dinner: Boolean(row.dinner),
    parkingNeeded,
    foodPreference: normalizeFoodPreference(row.food_preference),
  });
  const amount_paid_paise = Math.max(0, Math.floor(Number(row.amount_paid_paise) || 0));
  const payment_status = statusFromAmounts(total_cost_paise, amount_paid_paise);
  return {
    total_cost_paise,
    amount_paid_paise,
    amount_due_paise: amountDuePaise(total_cost_paise, amount_paid_paise),
    payment_status,
  };
}
