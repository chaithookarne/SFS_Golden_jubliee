import { partySize, type ParkingNeeded } from '../registration';
import { parseLocation } from '../registration-fields';

export type ExistingRegistrationRow = {
  number_of_guests: number;
  food_preference: string | null;
  parking_needed: string;
  lunch: boolean;
  dinner: boolean;
  attending: boolean;
  phone_number: string | null;
  payment_status: string;
  amount_paid_paise?: number;
  amount_due_paise?: number;
  total_cost_paise?: number;
};

export type RegistrationProfileSnapshot = {
  full_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  batch?: number | null;
  section?: string | null;
  current_location?: string | null;
};

export type RegistrationFormChoices = {
  number_of_guests: number;
  food_preference: 'veg' | 'non-veg';
  parking_needed: ParkingNeeded;
  lunch: boolean;
  dinner: boolean;
  attending: boolean;
  phone_number?: string;
  payment_status: string;
};

export type RegistrationPrefill = {
  full_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  batch?: number;
  section: string;
  city: string;
  country: string;
  number_of_guests: number;
  food_preference: 'veg' | 'non-veg';
  parking_needed: ParkingNeeded;
  lunch: boolean;
  dinner: boolean;
  attending: boolean;
  payment_status?: string;
  amount_paid_paise?: number;
  amount_due_paise?: number;
  total_cost_paise?: number;
};

const PARKING: ParkingNeeded[] = ['none', '2-wheeler', '4-wheeler'];

export function registrationChoicesFromRow(
  row: ExistingRegistrationRow | null | undefined
): RegistrationFormChoices | null {
  if (!row) return null;
  const parking = PARKING.includes(row.parking_needed as ParkingNeeded)
    ? (row.parking_needed as ParkingNeeded)
    : 'none';
  return {
    number_of_guests: partySize(Number(row.number_of_guests)),
    food_preference: row.food_preference === 'non-veg' ? 'non-veg' : 'veg',
    parking_needed: parking,
    lunch: Boolean(row.lunch),
    dinner: Boolean(row.dinner),
    attending: row.attending !== false,
    phone_number: row.phone_number || undefined,
    payment_status: row.payment_status,
  };
}

/** Merge account profile + saved event registration into registration-form fields. */
export function mergeRegistrationPrefill(
  profile: RegistrationProfileSnapshot | null | undefined,
  row: ExistingRegistrationRow | null | undefined
): RegistrationPrefill {
  const choices = registrationChoicesFromRow(row);
  const loc = parseLocation(profile?.current_location || '');
  const phone = choices?.phone_number || profile?.phone_number || '';
  return {
    full_name: String(profile?.full_name || '').trim(),
    last_name: String(profile?.last_name || '').trim(),
    email: String(profile?.email || '').trim(),
    phone_number: phone,
    batch: typeof profile?.batch === 'number' ? profile.batch : undefined,
    section: String(profile?.section || '').trim(),
    city: loc.city,
    country: loc.country,
    number_of_guests: partySize(choices?.number_of_guests ?? 1),
    food_preference: choices?.food_preference ?? 'veg',
    parking_needed: choices?.parking_needed ?? 'none',
    lunch: choices?.lunch ?? false,
    dinner: choices?.dinner ?? false,
    attending: choices?.attending ?? true,
    payment_status: choices?.payment_status,
    amount_paid_paise: Math.max(0, Number(row?.amount_paid_paise) || 0),
    amount_due_paise: Math.max(0, Number(row?.amount_due_paise) || 0),
    total_cost_paise: Math.max(0, Number(row?.total_cost_paise) || 0),
  };
}
