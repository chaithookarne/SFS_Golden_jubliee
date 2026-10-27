import assert from 'node:assert/strict';
import { parseLocation } from '../lib/registration-fields.ts';

function partySize(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x) || x < 1) return 1;
  return x;
}

function registrationChoicesFromRow(row) {
  if (!row) return null;
  const parking = ['none', '2-wheeler', '4-wheeler'].includes(row.parking_needed)
    ? row.parking_needed
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

function mergeRegistrationPrefill(profile, row) {
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
  };
}

const merged = mergeRegistrationPrefill(
  {
    full_name: 'Ada Lovelace',
    last_name: 'Lovelace',
    email: 'ada@gmail.com',
    phone_number: '+919876543210',
    batch: 1999,
    section: 'B',
    current_location: 'Hyderabad, India',
  },
  {
    number_of_guests: 2,
    food_preference: 'non-veg',
    parking_needed: '4-wheeler',
    lunch: true,
    dinner: false,
    attending: true,
    phone_number: '+919876543210',
    payment_status: 'pending',
  }
);

assert.equal(merged.full_name, 'Ada Lovelace');
assert.equal(merged.last_name, 'Lovelace');
assert.equal(merged.batch, 1999);
assert.equal(merged.section, 'B');
assert.equal(merged.city, 'Hyderabad');
assert.equal(merged.country, 'India');
assert.equal(merged.number_of_guests, 2);
assert.equal(merged.lunch, true);
assert.equal(merged.dinner, false);
assert.equal(merged.parking_needed, '4-wheeler');
assert.equal(merged.food_preference, 'non-veg');
assert.equal(merged.payment_status, 'pending');

const alone = mergeRegistrationPrefill(
  { full_name: 'Solo', email: 'solo@gmail.com', current_location: 'Hyderabad, India' },
  {
    number_of_guests: 0,
    food_preference: 'veg',
    parking_needed: 'none',
    lunch: true,
    dinner: false,
    attending: true,
    payment_status: 'pending',
  }
);
assert.equal(alone.number_of_guests, 1, '0 people in DB still defaults to 1');

const empty = mergeRegistrationPrefill({ full_name: 'New', email: 'n@gmail.com' }, null);
assert.equal(empty.number_of_guests, 1, 'no registration defaults to 1');

console.log('PASS registration prefill merge');
