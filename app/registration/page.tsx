// app/registration/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { normalizePhoneNumber } from '@/lib/phone';
import { calculateRegistrationCost } from '@/lib/registration';

type RegistrationStep = 'phone' | 'confirm_prefill' | 'details' | 'review' | 'success';

interface PreRegistrationData {
    id: string;
    phone_number: string;
    email: string;
    full_name: string;
    last_name?: string;
    batch?: number;
    section?: string;
    current_location?: string;
    food_preference?: 'veg' | 'non-veg';
    match_type: 'exact' | 'phone_only';
}

interface FormData {
    phone_number: string;
    full_name: string;
    last_name: string;
    batch?: number;
    section: string;
    current_location: string;
    email: string;
    number_of_guests: number;
    food_preference: 'veg' | 'non-veg';
    parking_needed: '2-wheeler' | '4-wheeler' | 'none';
    lunch: boolean;
    dinner: boolean;
    attending: boolean;
}

export default function RegistrationPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState<RegistrationStep>('phone');
    const [error, setError] = useState('');
    const [preRegData, setPreRegData] = useState<PreRegistrationData | null>(null);
    const [phoneInput, setPhoneInput] = useState('');
    const [formData, setFormData] = useState<FormData>({
        phone_number: '',
        full_name: '',
        last_name: '',
        section: '',
        current_location: '',
        email: '',
        number_of_guests: 0,
        food_preference: 'veg',
        parking_needed: 'none',
        lunch: false,
        dinner: false,
        attending: true,
    });
    const [totalCost, setTotalCost] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Check auth on mount
    useEffect(() => {
        async function checkAuth() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                setCurrentStep('phone');
                return;
            }

            setUser(user);

            // Fetch user profile
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFormData((prev) => ({
                    ...prev,
                    email: user.email || '',
                    phone_number: profile.phone_number || '',
                    full_name: profile.full_name || '',
                    last_name: profile.last_name || '',
                    batch: profile.batch,
                    section: profile.section || '',
                    current_location: profile.current_location || '',
                }));

                // Try to prefill from pre_registrations
                await prefillFromPreRegistration(
                    profile.phone_number,
                    user.email || ''
                );
                setCurrentStep('details');
            }

            setLoading(false);
        }

        checkAuth();
    }, []);

    // Prefill logic
    async function prefillFromPreRegistration(
        phoneNumber: string,
        email: string
    ) {
        if (!phoneNumber || !email) return;

        try {
            const normalized = normalizePhoneNumber(phoneNumber);
            if (!normalized) return;

            const { data, error } = await supabase.rpc(
                'find_pre_registration',
                {
                    input_phone: normalized,
                    input_email: email,
                }
            );

            if (error) {
                console.error('Prefill lookup error:', error);
                return;
            }

            if (data && data.length > 0) {
                const match = data[0];

                // If phone-only match, ask for confirmation
                if (match.match_type === 'phone_only') {
                    setPreRegData(match);
                    setCurrentStep('confirm_prefill');
                    return;
                }

                // Exact match: auto-prefill
                if (match.match_type === 'exact') {
                    setFormData((prev) => ({
                        ...prev,
                        full_name: match.full_name || prev.full_name,
                        last_name: match.last_name || prev.last_name,
                        batch: match.batch || prev.batch,
                        section: match.section || prev.section,
                        current_location: match.current_location || prev.current_location,
                        food_preference: (match.food_preference as 'veg' | 'non-veg') ||
                            prev.food_preference,
                    }));
                    setPreRegData(match);
                    setCurrentStep('details');
                }
            }
        } catch (err) {
            console.error('Prefill error:', err);
        }
    }

    // Handle phone lookup (for non-authenticated users)
    async function handlePhoneLookup(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const normalized = normalizePhoneNumber(phoneInput);
        if (!normalized) {
            setError('Invalid phone number format');
            return;
        }

        setLoading(true);

        try {
            // Check if this phone exists in users table
            const { data: existingUser } = await supabase
                .from('users')
                .select('email, phone_number, full_name, last_name, batch, section, current_location')
                .eq('phone_number', normalized)
                .maybeSingle();

            if (existingUser) {
                // User already registered, ask them to login
                setError(
                    'This phone number is already registered. Please log in to continue.'
                );
                setLoading(false);
                return;
            }

            // If not found, ask them to sign up
            setPhoneInput('');
            setError('');
            setLoading(false);
            return;
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    }

    // Update cost when meals/guests change
    useEffect(() => {
        const cost = calculateRegistrationCost({
            numberOfGuests: formData.number_of_guests,
            lunch: formData.lunch,
            dinner: formData.dinner,
            parkingNeeded: formData.parking_needed,
        });
        setTotalCost(cost);
    }, [formData.number_of_guests, formData.lunch, formData.dinner, formData.parking_needed]);

    // Handle registration submission
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        setError('');

        try {
            const { data: registration, error: regError } = await supabase
                .from('registrations')
                .insert([
                    {
                        event_id: '5a3cd9a3-af14-4750-a768-7d803e3622f8',
                        user_id: user.id,
                        phone_number: formData.phone_number,
                        number_of_guests: formData.number_of_guests,
                        food_preference: formData.food_preference,
                        parking_needed: formData.parking_needed,
                        lunch: formData.lunch,
                        dinner: formData.dinner,
                        total_cost: totalCost,
                        payment_status: 'pending',
                        attending: formData.attending,
                        pre_registration_id: preRegData?.id || null,
                    },
                ])
                .select();

            if (regError) {
                setError(regError.message);
                setSubmitting(false);
                return;
            }

            // TODO: Integrate with Razorpay to create order
            // const order = await createRazorpayOrder(registration[0].id, totalCost);

            setSubmitting(false);
            setCurrentStep('success');
        } catch (err) {
            setError('An error occurred. Please try again.');
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-secondary-container animate-spin mx-auto mb-4"></div>
                    <p className="text-body-md text-on-surface-variant">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login/signup card
    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 pt-20">
                <div className="w-full max-w-md">
                    <div className="bg-surface-paper rounded-2xl shadow-lg p-8 border border-surface-container-low text-center">
                        <div className="mb-6">
                            <span className="material-symbols-outlined text-[48px] text-jubilee-gold-deep mx-auto block">
                                how_to_reg
                            </span>
                        </div>

                        <h1 className="text-headline-lg text-primary mb-3">
                            Registration Required
                        </h1>

                        <p className="text-body-md text-on-surface-variant mb-8">
                            To register for the Golden Jubilee, you need to create an account or log in with your existing account.
                        </p>

                        <div className="flex flex-col gap-3 mb-6">
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-fixed text-label-md uppercase tracking-wider shadow-md transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    person_add
                                </span>
                                Create New Account
                            </Link>

                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary hover:bg-navy-subtle text-on-primary text-label-md uppercase tracking-wider shadow-md transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    login
                                </span>
                                Sign In to Existing Account
                            </Link>
                        </div>

                        <p className="text-body-sm text-on-surface-variant">
                            Already have an account? Sign in to automatically prefill your registration.
                        </p>

                        <div className="mt-8">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    arrow_back
                                </span>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 1: Phone confirmation (for phone-only matches)
    if (currentStep === 'confirm_prefill' && preRegData) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 pt-20 pb-12">
                <div className="w-full max-w-2xl">
                    <div className="bg-surface-paper rounded-2xl shadow-lg p-8 border border-surface-container-low">
                        <h1 className="text-headline-lg text-primary mb-2">
                            We found your information
                        </h1>
                        <p className="text-body-md text-on-surface-variant mb-8">
                            We found a match for your phone number, but with a different email. Is this your information?
                        </p>

                        {/* Pre-reg data display */}
                        <div className="bg-surface-container-low rounded-lg p-6 mb-6 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-label-md text-on-surface-variant">Name:</span>
                                <span className="text-body-md text-primary font-semibold">
                                    {preRegData.full_name} {preRegData.last_name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-label-md text-on-surface-variant">Email:</span>
                                <span className="text-body-md text-primary">{preRegData.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-label-md text-on-surface-variant">Batch:</span>
                                <span className="text-body-md text-primary">
                                    {preRegData.batch || 'Not specified'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-label-md text-on-surface-variant">Section:</span>
                                <span className="text-body-md text-primary">
                                    {preRegData.section || 'Not specified'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    // Accept and use pre-reg data
                                    setFormData((prev) => ({
                                        ...prev,
                                        full_name: preRegData.full_name,
                                        last_name: preRegData.last_name || '',
                                        batch: preRegData.batch,
                                        section: preRegData.section || '',
                                        current_location: preRegData.current_location || '',
                                        food_preference: (preRegData.food_preference as 'veg' | 'non-veg') || 'veg',
                                    }));
                                    setCurrentStep('details');
                                }}
                                className="flex-1 py-3 rounded-lg bg-primary text-on-primary text-label-md uppercase tracking-wider font-bold hover:bg-navy-subtle transition-all"
                            >
                                Yes, this is correct
                            </button>
                            <button
                                onClick={() => {
                                    // Reject and continue with signup data
                                    setPreRegData(null);
                                    setCurrentStep('details');
                                }}
                                className="flex-1 py-3 rounded-lg bg-surface-container text-primary text-label-md uppercase tracking-wider font-bold hover:bg-surface-container-high transition-all"
                            >
                                No, continue anyway
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2: Registration form
    if (currentStep === 'details') {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 pt-20 pb-12">
                <div className="w-full max-w-2xl">
                    <div className="bg-surface-paper rounded-2xl shadow-lg p-8 border border-surface-container-low">
                        <h1 className="text-headline-lg text-primary mb-2">
                            Event Registration
                        </h1>
                        <p className="text-body-sm text-on-surface-variant mb-8">
                            Complete your registration for the Golden Jubilee
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Info Section */}
                            <div>
                                <h2 className="text-headline-sm text-primary mb-4 uppercase tracking-wider">
                                    Personal Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, full_name: e.target.value })
                                            }
                                            required
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, last_name: e.target.value })
                                            }
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Batch (Year)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.batch || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    batch: e.target.value ? parseInt(e.target.value) : undefined,
                                                })
                                            }
                                            placeholder="e.g., 2010"
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Section
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.section}
                                            onChange={(e) =>
                                                setFormData({ ...formData, section: e.target.value })
                                            }
                                            placeholder="e.g., A, B, C"
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Current Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.current_location}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    current_location: e.target.value,
                                                })
                                            }
                                            placeholder="City, Country"
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Event Details Section */}
                            <div>
                                <h2 className="text-headline-sm text-primary mb-4 uppercase tracking-wider">
                                    Event Details
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                            Number of Guests *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.number_of_guests}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    number_of_guests: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            required
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                                        />
                                        <p className="text-label-sm text-on-surface-variant mt-1">
                                            How many guests will attend (excluding yourself)?
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-3 uppercase tracking-wider">
                                            Food Preference *
                                        </label>
                                        <div className="flex gap-4">
                                            {(['veg', 'non-veg'] as const).map((pref) => (
                                                <label key={pref} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="food_preference"
                                                        value={pref}
                                                        checked={formData.food_preference === pref}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                food_preference: e.target.value as 'veg' | 'non-veg',
                                                            })
                                                        }
                                                        disabled={submitting}
                                                        className="w-4 h-4 accent-primary cursor-pointer disabled:opacity-50"
                                                    />
                                                    <span className="text-body-sm text-on-surface capitalize">
                                                        {pref.replace('-', ' ')}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-3 uppercase tracking-wider">
                                            Meals *
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.lunch}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, lunch: e.target.checked })
                                                    }
                                                    disabled={submitting}
                                                    className="w-4 h-4 accent-primary cursor-pointer disabled:opacity-50"
                                                />
                                                <span className="text-body-sm text-on-surface">Lunch</span>
                                            </label>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.dinner}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, dinner: e.target.checked })
                                                    }
                                                    disabled={submitting}
                                                    className="w-4 h-4 accent-primary cursor-pointer disabled:opacity-50"
                                                />
                                                <span className="text-body-sm text-on-surface">Dinner</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-label-md text-primary mb-3 uppercase tracking-wider">
                                            Parking Needed *
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            {(
                                                [
                                                    { value: '2-wheeler', label: '2-Wheeler' },
                                                    { value: '4-wheeler', label: '4-Wheeler' },
                                                    { value: 'none', label: 'No Vehicle' },
                                                ] as const
                                            ).map((option) => (
                                                <label key={option.value} className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="parking"
                                                        value={option.value}
                                                        checked={
                                                            formData.parking_needed ===
                                                            (option.value as '2-wheeler' | '4-wheeler' | 'none')
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                parking_needed: e.target.value as
                                                                    | '2-wheeler'
                                                                    | '4-wheeler'
                                                                    | 'none',
                                                            })
                                                        }
                                                        disabled={submitting}
                                                        className="w-4 h-4 accent-primary cursor-pointer disabled:opacity-50"
                                                    />
                                                    <span className="text-body-sm text-on-surface">
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Summary */}
                            <div className="bg-surface-container-low rounded-lg p-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-headline-sm text-primary">Total Cost:</span>
                                    <span className="text-headline-md text-jubilee-gold-deep">
                                        ₹{(totalCost / 100).toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-label-sm text-on-surface-variant mt-2">
                                    {formData.number_of_guests + 1} person(s) ×{' '}
                                    {formData.lunch && formData.dinner
                                        ? 'Lunch + Dinner'
                                        : formData.lunch
                                            ? 'Lunch'
                                            : formData.dinner
                                                ? 'Dinner'
                                                : 'No meals'}{' '}
                                    + Parking
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-lg bg-error-container text-error text-body-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !formData.full_name}
                                className="w-full py-3 rounded-lg bg-primary text-on-primary text-label-md uppercase tracking-wider font-bold hover:bg-navy-subtle disabled:bg-surface-container disabled:text-on-surface-variant transition-all"
                            >
                                {submitting ? 'Processing...' : 'Continue to Payment'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    arrow_back
                                </span>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 3: Success
    if (currentStep === 'success') {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 pt-20">
                <div className="w-full max-w-md text-center">
                    <div className="bg-surface-paper rounded-2xl shadow-lg p-8 border border-surface-container-low">
                        <div className="mb-6">
                            <span className="material-symbols-outlined text-[64px] text-green-600 mx-auto block">
                                check_circle
                            </span>
                        </div>

                        <h1 className="text-headline-lg text-primary mb-3">
                            Registration Confirmed!
                        </h1>

                        <p className="text-body-md text-on-surface-variant mb-8">
                            Your registration has been submitted successfully. Proceed to complete the payment to finalize your registration.
                        </p>

                        <div className="bg-surface-container-low rounded-lg p-6 mb-8 text-left">
                            <p className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                Total Amount Due:
                            </p>
                            <p className="text-display-xl text-jubilee-gold-deep">
                                ₹{(totalCost / 100).toFixed(2)}
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary hover:bg-navy-subtle text-on-primary text-label-md uppercase tracking-wider shadow-md transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                home
                            </span>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}