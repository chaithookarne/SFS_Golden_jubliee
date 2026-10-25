// components/hero.tsx
'use client';

import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative w-full h-[620px] lg:h-[700px] overflow-hidden -mt-20">
            {/* Image centered on mobile, shifted right on desktop */}
            <div className="absolute inset-0 overflow-hidden">
                <img
                    alt="St. Francis de Sales High School Building Campus"
                    className="w-full h-full object-cover object-center sm:object-right transform scale-105"
                    src="/images/campus-hero.jpg"
                />
            </div>

            {/* Dark overlay: strong all-around wash on mobile, left-to-right gradient on desktop */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/40 sm:bg-gradient-to-r sm:from-primary sm:via-primary/50 sm:to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent"></div>

            {/* Content */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-end pb-12 lg:pb-16 pt-24 pointer-events-none">
                <div className="max-w-2xl text-left pointer-events-auto">
                    {/* Gold accent pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/90 border border-secondary-container/40 backdrop-blur-md shadow-md mb-4">
                        <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                        <span className="text-label-sm uppercase tracking-widest text-secondary-fixed">
                            Celebrating 50 Years • 1976 – 2026
                        </span>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-headline-lg lg:text-display-xl text-surface-paper tracking-tight leading-tight mb-4 drop-shadow-md">
                        Golden Jubilee & Alumni Homecoming
                    </h1>

                    {/* Subheading */}
                    <p className="text-body-md lg:text-body-lg text-surface-container-high leading-relaxed mb-8 max-w-xl">
                        Honoring 50 glorious years of transformational education, enduring memories, and fraternal unity at SFS Shanthinagar. Calling all alumni, revered faculty, and students to reunite.
                    </p>

                    {/* CTA Button */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href="/registration"
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-fixed text-label-md uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                how_to_reg
                            </span>
                            Register for Golden Jubilee
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}