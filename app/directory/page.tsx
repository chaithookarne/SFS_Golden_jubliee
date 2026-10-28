'use client';

import { FormEvent, useEffect, useState } from 'react';
import MemberGate from '@/components/member-gate';
import PortalShell from '@/components/portal-shell';
import type { DirectoryAlum } from '@/lib/directory/search';

export default function DirectoryPage() {
  const [term, setTerm] = useState('');
  const [batch, setBatch] = useState('');
  const [rows, setRows] = useState<DirectoryAlum[]>([]);
  const [message, setMessage] = useState('Search portal logins by name, username, city, profession, or batch.');
  const [loading, setLoading] = useState(false);

  async function runSearch(query: string, batchYear: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (batchYear) params.set('batch', batchYear);
      const res = await fetch(`/api/directory?${params}`, { cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        setMessage(payload.error || 'Directory search is not available yet.');
        return;
      }
      const alumni = (payload.alumni || []) as DirectoryAlum[];
      setRows(alumni);
      const label = [query.trim(), batchYear ? `Class of ${batchYear}` : ''].filter(Boolean).join(' · ');
      setMessage(
        alumni.length
          ? ''
          : label
            ? `No portal logins match “${label}”.`
            : 'No portal logins yet.'
      );
    } catch {
      setRows([]);
      setMessage('Directory is not configured yet.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch(term, batch);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      let myBatch = '';
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.batch != null && Number.isFinite(Number(me.batch))) {
            myBatch = String(Number(me.batch));
          }
        }
      } catch {
        /* fall through — search without batch */
      }
      if (!active) return;
      setBatch(myBatch);
      await runSearch('', myBatch);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalShell
      title="Find your SFS people"
      intro={
        batch
          ? `Defaults to Class of ${batch}. Search by name, username, city, or profession — or pick another batch.`
          : 'Search by name, username, city, profession, or graduating batch.'
      }
    >
      <MemberGate>
        <form
          onSubmit={onSubmit}
          className="pb-5 mb-2 border-b border-outline-variant grid gap-4 md:grid-cols-[1fr_160px_auto]"
        >
          <label className="text-label-sm text-primary font-bold">
            Name, username, city or profession
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Sridevi, Hyderabad, Teacher"
              className="block mt-2 w-full border-0 border-b border-outline-variant rounded-none px-0 py-2.5 text-body-sm bg-transparent focus:outline-none focus:border-jubilee-gold-deep"
            />
          </label>
          <label className="text-label-sm text-primary font-bold">
            Batch
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="block mt-2 w-full border-0 border-b border-outline-variant rounded-none px-0 py-2.5 text-body-sm bg-transparent focus:outline-none focus:border-jubilee-gold-deep"
            >
              <option value="">All batches</option>
              {Array.from({ length: 51 }, (_, i) => 1976 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="self-end rounded-lg bg-primary text-on-primary px-5 py-2.5 text-label-md font-bold disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-body-sm text-on-surface-variant">{message}</p>
        )}

        {rows.length > 0 && (
          <ul className="mt-2 divide-y divide-outline-variant" aria-label="Portal logins">
            {rows.map((p) => (
              <li
                key={p.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="text-headline-sm text-primary leading-tight">{p.full_name}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {p.username || '—'}
                    {p.batch != null ? ` · Class of ${p.batch}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </MemberGate>
    </PortalShell>
  );
}
