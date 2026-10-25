'use client';

import { useEffect, useState } from 'react';
import MemberGate from '@/components/member-gate';
import PortalShell from '@/components/portal-shell';

type Person = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  batch: number | null;
  created_at: string;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Person[]>([]);
  const [message, setMessage] = useState('Loading pending requests…');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/admin/pending');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setMessage(payload.error || 'Admin queue is not connected.');
        setRows([]);
        return;
      }
      const data = (await res.json()) as Person[];
      setRows(data);
      setMessage(data.length ? '' : 'No pending applications.');
    } catch {
      setMessage('Admin queue is not configured yet.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, status: 'verified' | 'rejected') {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/decide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setMessage(payload.error || 'Could not update membership.');
      } else {
        setRows((prev) => prev.filter((p) => p.id !== id));
        setMessage(`Membership ${status === 'verified' ? 'approved' : 'rejected'}.`);
      }
    } finally {
      setBusy('');
    }
  }

  return (
    <PortalShell title="Membership review" eyebrow="ALUMNI COMMITTEE WORKSPACE">
      <MemberGate mode="admin">
        <div className="rounded-2xl bg-white border border-outline-variant p-5 mb-5">
          <h2 className="text-headline-sm text-primary">Pending applications</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Verify applicants against authorised school or alumni records before granting directory
            access.
          </p>
        </div>
        {message && (
          <p
            role="status"
            className="rounded-xl bg-white border border-outline-variant p-5 text-body-sm text-on-surface-variant mb-4"
          >
            {message}
          </p>
        )}
        <div className="space-y-3">
          {rows.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-outline-variant bg-white p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between"
            >
              <div>
                <h3 className="text-headline-sm text-primary">{p.full_name}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {p.email} {p.phone_number ? `· ${p.phone_number}` : ''}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {p.batch ? `Batch ${p.batch}` : 'Batch not provided'} · Requested{' '}
                  {new Date(p.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!!busy}
                  onClick={() => decide(p.id, 'verified')}
                  className="rounded-lg bg-primary text-white px-4 py-2.5 text-label-sm disabled:opacity-50"
                >
                  {busy === p.id ? 'Saving…' : 'Approve'}
                </button>
                <button
                  disabled={!!busy}
                  onClick={() => decide(p.id, 'rejected')}
                  className="rounded-lg border border-outline-variant text-primary px-4 py-2.5 text-label-sm disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </MemberGate>
    </PortalShell>
  );
}
