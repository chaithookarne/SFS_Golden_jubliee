import {
  calculateEventRegistrationCost,
  getEventCostBreakdown,
  validateRegistrationCost,
} from '../lib/registration.ts';

const jubilee = {
  lunch_paise: 30000,
  dinner_paise: 50000,
  parking_2w_paise: 5000,
  parking_4w_paise: 20000,
  base_ticket_paise: 0,
};

const input = {
  numberOfGuests: 2,
  lunch: true,
  dinner: true,
  parkingNeeded: '4-wheeler',
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(calculateEventRegistrationCost(jubilee, input) === 180000, 'two people 180000');
assert(
  calculateEventRegistrationCost(jubilee, { ...input, numberOfGuests: 1 }) === 100000,
  'one person is 100000, not an extra default person'
);
assert(
  calculateEventRegistrationCost({ ...jubilee, base_ticket_paise: 10000 }, input) === 190000,
  'with base 190000'
);
const bd = getEventCostBreakdown(jubilee, input);
assert(bd.totalCost === 180000, 'breakdown total');
assert(bd.baseCost === 0, 'base 0');
assert(validateRegistrationCost(jubilee, input) === true, 'valid');
assert(
  validateRegistrationCost(jubilee, {
    numberOfGuests: 0,
    lunch: false,
    dinner: false,
    parkingNeeded: 'none',
  }) === false,
  'empty invalid'
);
assert(
  validateRegistrationCost({ ...jubilee, base_ticket_paise: 10000 }, {
    numberOfGuests: 0,
    lunch: false,
    dinner: false,
    parkingNeeded: 'none',
  }) === true,
  'base alone valid'
);

const split = {
  ...jubilee,
  lunch_nonveg_paise: 45000,
  dinner_nonveg_paise: 70000,
};
const one = { numberOfGuests: 1, lunch: true, dinner: true, parkingNeeded: '4-wheeler' };
assert(
  calculateEventRegistrationCost(split, { ...one, foodPreference: 'veg' }) === 100000,
  'veg uses the veg meal rates'
);
assert(
  calculateEventRegistrationCost(split, { ...one, foodPreference: 'non-veg' }) === 135000,
  'non-veg uses the higher meal rates'
);
assert(
  calculateEventRegistrationCost(jubilee, { ...one, foodPreference: 'non-veg' }) === 100000,
  'non-veg falls back to veg rates when no separate price is set'
);
assert(
  getEventCostBreakdown(split, { ...one, foodPreference: 'non-veg' }).details.includes('non-veg'),
  'breakdown names the non-veg rate'
);

const parkingOnly = {
  numberOfGuests: 2,
  lunch: false,
  dinner: false,
  parkingNeeded: '4-wheeler',
  foodPreference: 'none',
};
assert(validateRegistrationCost(jubilee, parkingOnly) === true, 'parking alone is valid with no food');
assert(calculateEventRegistrationCost(jubilee, parkingOnly) === 20000, 'no-food parking-only is parking only');
assert(
  getEventCostBreakdown(jubilee, parkingOnly).details.includes('No meals'),
  'no-food breakdown says No meals'
);

console.log('PASS event registration cost');
