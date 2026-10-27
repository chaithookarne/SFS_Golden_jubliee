'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

const baseLinks: [string, string][] = [
  ['/member', 'My home'],
  ['/directory', 'Alumni directory'],
  ['/events', 'Events'],
  ['/stories', 'Stories'],
  ['/memories', 'Memories'],
  ['/about-association', 'Association'],
];

export default function PortalShell({
  children,
  title,
  eyebrow = 'SFS ALUMNI COMMUNITY',
  intro = 'Reconnect with the people, places and memories that make St. Francis de Sales part of your story.',
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  intro?: string;
}) {
  const path = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!active || !res.ok) return;
        const me = await res.json();
        if (active) setIsAdmin(me.role === 'admin' && me.member_status === 'verified');
      } catch {
        if (active) setIsAdmin(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const links = isAdmin ? [...baseLinks, ['/admin', 'Admin'] as [string, string]] : baseLinks;

  return (
    <main className="min-h-screen bg-surface pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="mb-8">
          <div className="text-label-sm uppercase tracking-[.18em] text-jubilee-gold-deep font-bold mb-3">
            {eyebrow}
          </div>
          <h1 className="text-headline-lg md:text-5xl text-primary leading-tight">{title}</h1>
          <p className="text-body-md text-on-surface-variant mt-3 max-w-2xl">{intro}</p>
        </div>
        <nav
          aria-label="Alumni portal"
          className="flex gap-2 overflow-x-auto pb-3 mb-7 border-b border-outline-variant"
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-label-sm ${
                path === href
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-primary hover:bg-secondary-container'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  );
}
