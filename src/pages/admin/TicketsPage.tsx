import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { apiService, type AdminTicket } from '../../services/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiService
      .getAdminTickets()
      .then((data) => {
        setTickets(data);
        setError('');
      })
      .catch((e: unknown) => {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load tickets';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      return (
        t.ticketId.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.eventName.toLowerCase().includes(q) ||
        t.visitorName.toLowerCase().includes(q) ||
        t.visitorId.toLowerCase().includes(q)
      );
    });
  }, [query, tickets]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Tickets</h1>
        <p className="mt-1 text-sm text-gray-600">All generated tickets across events.</p>
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
              placeholder="Search by ticket number, visitor, event, or id"
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
          <p className="py-8 text-center text-sm text-gray-500">No tickets available.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ticket
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Visitor
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Event
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type / Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Issued
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((t) => (
                    <tr key={t.ticketId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{t.ticketNumber}</p>
                        <p className="font-mono text-[11px] text-gray-500 break-all">{t.ticketId}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{t.visitorName}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{t.eventName}</p>
                        <p className="font-mono text-[11px] text-gray-500 break-all">{t.eventSlug}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-[#B30447]">
                          {t.ticketType}
                        </span>
                        <span className="ml-2 inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                        {new Date(t.issuedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {filtered.map((t) => (
                <div key={t.ticketId} className="rounded-2xl border border-gray-200 p-4">
                  <p className="font-display text-sm font-bold text-gray-900">{t.ticketNumber}</p>
                  <p className="mt-1 text-xs text-gray-600">{t.eventName}</p>
                  <p className="mt-1 text-xs text-gray-700">
                    <span className="font-semibold">{t.visitorName}</span> ({t.ticketType})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-[#B30447]">
                      {t.ticketType}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-gray-500 break-all">{t.ticketId}</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Issued: {new Date(t.issuedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

