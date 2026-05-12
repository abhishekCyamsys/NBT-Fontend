import { Link } from 'react-router-dom';
import { ArrowLeft, History, Filter, ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService, VolunteerScanHistoryItem, VisitorEvent } from '../../services/api';

export default function VolunteerHistory() {
  const [items, setItems] = useState<VolunteerScanHistoryItem[]>([]);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [eventId, setEventId] = useState<string>(() => localStorage.getItem('scan_event_id') ?? '');
  const [gateNumber, setGateNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getVolunteerEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0 && !eventId) {
          const firstId = data[0].id || data[0].eventId;
          setEventId(firstId);
          localStorage.setItem('scan_event_id', firstId);
        }
      })
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  const fetchHistory = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getVolunteerScanHistory(
        eventId,
        gateNumber ? Number(gateNumber) : undefined,
        page,
        20
      );
      setItems(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch scan history', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [eventId, gateNumber, page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-fuchsia-50 to-white px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/volunteer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="text-right">
            <h1 className="font-display text-2xl font-bold text-gray-900">Scan History</h1>
            <p className="text-xs text-gray-600">Review recent entry validations</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Event</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  localStorage.setItem('scan_event_id', e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
              >
                <option value="">Select Event</option>
                {events.map((ev) => (
                  <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>{ev.name || ev.slug}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Gate Filter</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                placeholder="All Gates"
                value={gateNumber}
                onChange={(e) => {
                  setGateNumber(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <p className="font-bold text-gray-900">Recent Scans</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {error && (
            <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {!loading && items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <History className="h-8 w-8" />
              </div>
              <p className="text-gray-500 font-medium">No scan history found</p>
              <p className="mt-1 text-sm text-gray-400">Try changing the filters or check another event</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4">Visitor</th>
                    <th className="px-6 py-4">Ticket Type</th>
                    <th className="px-6 py-4">Scan Time</th>
                    <th className="px-6 py-4 text-right">Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{it.visitorName}</p>
                        <p className="text-xs text-gray-500">{it.visitorMobile}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${it.ticketType === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                          {it.ticketType === 'parent' ? 'Standard' : 'Child'}
                        </span>
                        <p className="mt-0.5 text-[10px] text-gray-400 font-mono">{it.passNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(it.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {it.gateNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <p className="text-xs font-medium text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

