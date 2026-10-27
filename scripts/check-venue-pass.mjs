import { venuePassSummary } from '../lib/events/venue-pass.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const paid = venuePassSummary({
  number_of_guests: 2,
  lunch: true,
  dinner: true,
  parking_needed: '4-wheeler',
  food_preference: 'veg',
  payment_status: 'paid',
  amount_due_paise: 0,
  registration_code: 'SFS-4K7M2',
});
assert(paid.paid === true, 'fully paid pass is paid');
assert(paid.code === 'SFS-4K7M2', 'paid pass keeps the registration id');
assert(paid.people === 2, 'people count is the party size');
assert(paid.meals === 'Lunch · Dinner', 'both meals are listed');
assert(paid.parking === '4-wheeler', 'parking is shown');
assert(paid.food === 'Veg', 'veg preference is shown');

const owed = venuePassSummary({
  number_of_guests: 1,
  lunch: false,
  dinner: false,
  parking_needed: 'none',
  food_preference: 'non-veg',
  payment_status: 'partial',
  amount_due_paise: 20000,
  registration_code: 'SFS-KEEP1',
});
assert(owed.paid === false, 'a balance is not a paid pass');
assert(owed.code === 'SFS-KEEP1', 'an existing id still shows so staff can look it up');
assert(owed.meals === 'No meals', 'missing meals are explicit');
assert(owed.parking === 'No vehicle', 'no parking is explicit');
assert(owed.food === 'Non-veg', 'non-veg preference is shown');

const noFood = venuePassSummary({
  number_of_guests: 1,
  lunch: false,
  dinner: false,
  parking_needed: '2-wheeler',
  food_preference: 'none',
  payment_status: 'paid',
  amount_due_paise: 0,
  registration_code: 'SFS-NOFD1',
});
assert(noFood.food === 'No food', 'none preference shows as No food');
assert(noFood.meals === 'No meals', 'no-food pass has no meals');

console.log('check-venue-pass: PASS');
