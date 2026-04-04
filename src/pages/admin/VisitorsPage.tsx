import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { apiService, type AdminVisitor } from '../../services/api';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<AdminVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getAdminVisitors()
      .then((data) => {
        if (!cancelled) {
          setVisitors(data);
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load visitors';
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) => {
      return (
        v.name.toLowerCase().includes(q) ||
        v.mobileNumber.toLowerCase().includes(q) ||
        v.visitorId.toLowerCase().includes(q) ||
        v.registrationId.toLowerCase().includes(q) ||
        v.eventName.toLowerCase().includes(q)
      );
    });
  }, [query, visitors]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Visitors</h1>
        <p className="mt-1 text-sm text-gray-600">All registrations with profile and entry status.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 pl-9 text-sm focus:border-[#B30447] focus:outline-none"
              placeholder="Search by name, phone, or visitor ID"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B30447]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No visitors match your search.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Event
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Visitor
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mobile
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Source
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Children
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((v) => (
                    <tr key={v.registrationId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{v.eventName}</p>
                        <p className="font-mono text-[11px] text-gray-500">{v.eventSlug}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-700">+{v.mobileNumber}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {v.registrationSource}
                        </span>
                        {v.otpVerified && (
                          <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            OTP verified
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-700">{v.childCount}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {filtered.map((v) => {
                const isOpen = !!expanded[v.registrationId];
                return (
                  <div key={v.registrationId} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-gray-900">{v.name}</p>
                        <p className="mt-1 text-xs text-gray-600">{v.eventName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded((p) => ({ ...p, [v.registrationId]: !p[v.registrationId] }))}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700"
                      >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Mobile</p>
                        <p className="font-semibold text-gray-900">+{v.mobileNumber}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Age</p>
                        <p className="font-semibold text-gray-900">{v.age}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Source</p>
                        <p className="font-semibold text-gray-900">{v.registrationSource}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Children</p>
                        <p className="font-semibold text-gray-900">{v.childCount}</p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-xl border border-gray-200 p-3">
                          <p className="text-xs font-semibold text-gray-700">IDs</p>
                          <p className="mt-1 font-mono text-[11px] text-gray-600 break-all">visitor:{v.visitorId}</p>
                          <p className="mt-1 font-mono text-[11px] text-gray-600 break-all">event:{v.eventId}</p>
                        </div>

                        {v.children?.length > 0 && (
                          <div className="rounded-xl border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-700">Children</p>
                            <div className="mt-2 space-y-2">
                              {v.children.map((c) => (
                                <div key={c.id} className="rounded-lg bg-gray-50 p-2">
                                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                  <p className="text-xs text-gray-600">Age: {c.age}</p>
                                  <p className="font-mono text-[11px] text-gray-500 break-all">{c.id}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-gray-500">
                      Created: {new Date(v.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

