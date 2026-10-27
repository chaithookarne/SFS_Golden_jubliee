export type VenuePassInput = {
  number_of_guests: number;
  lunch: boolean;
  dinner: boolean;
  parking_needed: string;
  food_preference: string | null;
  payment_status: string;
  amount_due_paise: number;
  registration_code?: string | null;
};

export type VenuePassSummary = {
  people: number;
  meals: string;
  parking: string;
  food: string;
  paid: boolean;
  code: string | null;
};

export function venuePassSummary(reg: VenuePassInput): VenuePassSummary {
  const meals = [reg.lunch && 'Lunch', reg.dinner && 'Dinner'].filter(Boolean).join(' · ');
  const parking =
    reg.parking_needed === '2-wheeler'
      ? '2-wheeler'
      : reg.parking_needed === '4-wheeler'
        ? '4-wheeler'
        : 'No vehicle';
  return {
    people: Math.max(1, Math.floor(Number(reg.number_of_guests) || 1)),
    meals: meals || 'No meals',
    parking,
    food: reg.food_preference === 'non-veg' ? 'Non-veg' : 'Veg',
    paid: reg.payment_status === 'paid' && Math.max(0, Number(reg.amount_due_paise) || 0) === 0,
    code: reg.registration_code || null,
  };
}
