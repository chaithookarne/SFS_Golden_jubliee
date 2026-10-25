// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!agreeTerms) {
            setError('Please agree to the terms and conditions');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    fullName: fullName.trim(),
                    phoneNumber: phoneNumber.trim(),
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(payload.error || 'Failed to create account');
                setLoading(false);
                return;
            }

            setSuccess('Account created! Redirecting...');
            setTimeout(() => {
                router.push('/registration');
            }, 1500);
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-6 pt-20">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img
                            alt="SFS Shanthinagar Emblem"
                            className="h-12 w-auto object-contain"
                            src="/images/emblem.png"
                        />
                    </div>
                    <h1 className="text-headline-lg text-primary mb-2">Create Your Account</h1>
                    <p className="text-body-sm text-on-surface-variant">
                        Join the Golden Jubilee celebration and register for the reunion
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-surface-paper rounded-xl shadow-md p-8 border border-surface-container-low">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full Name */}
                        <div className="flex flex-col">
                            <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                required
                                disabled={loading}
                                className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-surface-container disabled:text-on-surface-variant"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="flex flex-col">
                            <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={loading}
                                className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-surface-container disabled:text-on-surface-variant"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="flex flex-col">
                            <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+91 98765 43210"
                                required
                                disabled={loading}
                                className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-surface-container disabled:text-on-surface-variant"
                            />
                            <p className="text-label-sm text-on-surface-variant mt-1">
                                We'll use this to prefill your registration details
                            </p>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col">
                            <label className="text-label-md text-primary mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                                disabled={loading}
                                className="px-4 py-3 rounded-lg border border-outline-variant text-body-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-surface-container disabled:text-on-surface-variant"
                            />
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-2.5 mt-5">
                            <input
                                type="checkbox"
                                id="agree-terms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                disabled={loading}
                                className="mt-1 w-5 h-5 rounded border-outline-variant accent-primary cursor-pointer disabled:opacity-50"
                            />
                            <label htmlFor="agree-terms" className="text-body-sm text-on-surface-variant cursor-pointer">
                                I agree to the{' '}
                                <Link href="#" className="text-primary hover:text-navy-subtle underline">
                                    terms and conditions
                                </Link>{' '}
                                and{' '}
                                <Link href="#" className="text-primary hover:text-navy-subtle underline">
                                    privacy policy
                                </Link>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-error-container text-error text-body-sm">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="p-3 rounded-lg bg-green-100 text-green-800 text-body-sm">
                                {success}
                            </div>
                        )}

                        {/* Signup Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreeTerms}
                            className="w-full py-3 rounded-lg bg-primary text-on-primary text-label-md uppercase tracking-wider font-bold hover:bg-navy-subtle disabled:bg-surface-container disabled:text-on-surface-variant transition-all mt-6"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-outline-variant"></div>
                        <span className="text-label-sm text-on-surface-variant">OR</span>
                        <div className="flex-1 h-px bg-outline-variant"></div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-body-sm text-on-surface-variant mb-3">
                            Already have an account?
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-fixed text-label-md uppercase tracking-wider transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">login</span>
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}