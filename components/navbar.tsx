// components/navbar.tsx

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NavBar() {
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const me = await res.json();
                    setUser({ email: me.email });
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, []);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setMobileMenuOpen(false);
        router.push('/');
    }

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
                {/* Logo + School Name */}
                <Link
                    className="flex items-center gap-2.5 sm:gap-3.5 group text-left min-w-0"
                    href="/"
                >
                    <div className="relative flex-shrink-0">
                        <img
                            alt="SFS Shanthinagar Emblem"
                            className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full shadow-[0_2px_8px_rgba(184,134,11,0.15)]"
                            src="/images/emblem.png"
                        />
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="text-sm sm:text-headline-sm text-primary tracking-tight leading-tight font-semibold truncate group-hover:text-navy-subtle transition-colors">
                            St. Francis de Sales' High School
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                            <span className="text-[10px] sm:text-label-sm uppercase tracking-widest text-on-surface-variant truncate">
                                Shanthinagar, Secunderabad
                            </span>
                            <span className="inline-block w-1 h-1 rounded-full bg-jubilee-amber flex-shrink-0"></span>
                            <span className="text-[10px] sm:text-label-sm uppercase tracking-wider text-jubilee-gold-deep font-bold truncate">
                                Est. 1976
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Desktop Navigation Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/registration"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed text-label-md uppercase tracking-wider shadow-sm transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                        Register
                    </Link>

                    <div className="h-5 w-px bg-outline-variant"></div>

                    {!loading && user && (
                        <Link href="/member" className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-label-md uppercase tracking-wider text-primary hover:bg-surface-container transition-colors">
                            Alumni Portal
                        </Link>
                    )}

                    {!loading && !user ? (
                        <>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-label-md uppercase tracking-wider text-primary hover:bg-surface-container transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-label-md uppercase tracking-wider bg-primary text-on-primary hover:bg-navy-subtle shadow-sm transition-all"
                            >
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-label-sm text-on-surface-variant px-3 max-w-[160px] truncate">
                                {user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-label-md uppercase tracking-wider text-error hover:bg-error-container transition-colors"
                                title="Logout"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg text-primary hover:bg-surface-container transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {mobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-outline-variant shadow-lg py-4 px-6 flex flex-col gap-3 transition-all">
                    <Link
                        href="/registration"
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-fixed text-label-md uppercase tracking-wider shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                        Register
                    </Link>

                    <hr className="border-outline-variant my-1" />

                    {!loading && !user ? (
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-label-md uppercase tracking-wider text-primary hover:bg-surface-container transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg text-label-md uppercase tracking-wider bg-primary text-on-primary shadow-sm"
                            >
                                Sign Up
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 text-center">
                            <Link href="/member" onClick={() => setMobileMenuOpen(false)} className="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-label-md uppercase tracking-wider bg-surface-container text-primary">
                                Alumni Portal
                            </Link>
                            <span className="text-label-sm text-on-surface-variant truncate py-1">
                                {user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-label-md uppercase tracking-wider text-error bg-error-container/50 hover:bg-error-container transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}