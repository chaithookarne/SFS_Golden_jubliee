// lib/registration.ts

interface CostCalculationInput {
    numberOfGuests: number;
    lunch: boolean;
    dinner: boolean;
    parkingNeeded: '2-wheeler' | '4-wheeler' | 'none';
}

/**
 * Calculate total registration cost in paise (for Razorpay)
 *
 * Pricing:
 * - Lunch: ₹300 per person
 * - Dinner: ₹500 per person
 * - 2-wheeler parking: ₹50
 * - 4-wheeler parking: ₹200
 * - No parking: ₹0
 *
 * Example:
 * - 1 alumni + 1 guest (2 people) with lunch + dinner + 4-wheeler parking
 * - Cost = (2 × 300) + (2 × 500) + 200 = 600 + 1000 + 200 = ₹1800 = 180000 paise
 */
export function calculateRegistrationCost(input: CostCalculationInput): number {
    const totalPeople = 1 + input.numberOfGuests; // alumni + guests

    let cost = 0;

    // Meal costs in paise
    const lunchCostPerPerson = 30000; // ₹300
    const dinnerCostPerPerson = 50000; // ₹500

    // Calculate meal costs
    if (input.lunch) {
        cost += totalPeople * lunchCostPerPerson;
    }

    if (input.dinner) {
        cost += totalPeople * dinnerCostPerPerson;
    }

    // Parking costs in paise (one-time, not per person)
    const parkingCosts: Record<string, number> = {
        '2-wheeler': 5000, // ₹50
        '4-wheeler': 20000, // ₹200
        'none': 0,
    };

    cost += parkingCosts[input.parkingNeeded] || 0;

    return cost; // in paise, ready for Razorpay
}

/**
 * Get cost breakdown for display
 */
export function getCostBreakdown(input: CostCalculationInput): {
    mealCost: number;
    parkingCost: number;
    totalCost: number;
    details: string;
} {
    const totalPeople = 1 + input.numberOfGuests;
    let mealCost = 0;
    let details = '';

    if (input.lunch && input.dinner) {
        mealCost = totalPeople * (30000 + 50000); // ₹800 per person
        details = `${totalPeople} person(s) × (Lunch ₹300 + Dinner ₹500)`;
    } else if (input.lunch) {
        mealCost = totalPeople * 30000;
        details = `${totalPeople} person(s) × Lunch ₹300`;
    } else if (input.dinner) {
        mealCost = totalPeople * 50000;
        details = `${totalPeople} person(s) × Dinner ₹500`;
    } else {
        details = `${totalPeople} person(s) × No meals`;
    }

    const parkingCosts: Record<string, number> = {
        '2-wheeler': 5000,
        '4-wheeler': 20000,
        'none': 0,
    };

    const parkingCost = parkingCosts[input.parkingNeeded] || 0;

    const totalCost = mealCost + parkingCost;

    return {
        mealCost,
        parkingCost,
        totalCost,
        details,
    };
}

/**
 * Format cost for display (convert paise to rupees)
 */
export function formatCostForDisplay(costInPaise: number): string {
    const rupees = costInPaise / 100;
    return `₹${rupees.toFixed(2)}`;
}

/**
 * Validate cost is not zero (at least one meal or parking selected)
 */
export function validateRegistrationCost(input: CostCalculationInput): boolean {
    const hasMeal = input.lunch || input.dinner;
    const hasParking = input.parkingNeeded !== 'none';

    // Cost must be > 0, meaning at least meal or parking is selected
    return hasMeal || hasParking;
}