import { registerHooks } from 'node:module';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
  resolve(specifier, context, nextResolve) {
    let spec = specifier;
    if (spec.startsWith('@/')) spec = pathToFileURL(path.join(root, spec.slice(2))).href;
    if (spec.startsWith('.')) {
      const parent = context.parentURL ? fileURLToPath(context.parentURL) : root;
      const abs = path.resolve(path.dirname(parent), spec);
      if (!path.extname(abs) && existsSync(`${abs}.ts`)) spec = pathToFileURL(`${abs}.ts`).href;
    } else if (spec.startsWith('file:')) {
      const abs = fileURLToPath(spec);
      if (!path.extname(abs) && existsSync(`${abs}.ts`)) spec = pathToFileURL(`${abs}.ts`).href;
    }
    return nextResolve(spec, context);
  },
});

const { registrationChoicesFromRow } = await import('../lib/events/existing-registration.ts');

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

const none = registrationChoicesFromRow({
  number_of_guests: 1,
  food_preference: 'none',
  parking_needed: '2-wheeler',
  lunch: false,
  dinner: false,
  attending: true,
  payment_status: 'paid',
});
assert.equal(none.food_preference, 'none');
assert.equal(none.lunch, false);
assert.equal(none.dinner, false);

console.log('PASS existing registration → form choices');
