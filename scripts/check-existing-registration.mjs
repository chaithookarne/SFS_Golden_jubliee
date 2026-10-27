import assert from 'node:assert/strict';

function registrationChoicesFromRow(row) {
  if (!row) return null;
  const parking = ['none', '2-wheeler', '4-wheeler'].includes(row.parking_needed)
    ? row.parking_needed
    : 'none';
  return {
    number_of_guests: Math.max(0, Number(row.number_of_guests) || 0),
    food_preference: row.food_preference === 'non-veg' ? 'non-veg' : 'veg',
    parking_needed: parking,
    lunch: Boolean(row.lunch),
    dinner: Boolean(row.dinner),
    attending: row.attending !== false,
    phone_number: row.phone_number || undefined,
    payment_status: row.payment_status,
  };
}

const choices = registrationChoicesFromRow({
  number_of_guests: 2,
  food_preference: 'non-veg',
  parking_needed: '4-wheeler',
  lunch: true,
  dinner: false,
  attending: true,
  phone_number: '+919876543210',
  payment_status: 'pending',
});

assert.equal(choices.number_of_guests, 2);
assert.equal(choices.food_preference, 'non-veg');
assert.equal(choices.parking_needed, '4-wheeler');
assert.equal(choices.lunch, true);
assert.equal(choices.dinner, false);
assert.equal(choices.attending, true);
assert.equal(choices.phone_number, '+919876543210');
assert.equal(choices.payment_status, 'pending');
assert.equal(registrationChoicesFromRow(null), null);

console.log('PASS existing registration → form choices');
