import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiService, type AdminTicket, type PaginatedResponse } from '../../services/api';
import { useEventContext } from '../../context/EventContext';
import Loader from '../../components/Loader';

export default function TicketsPage() {
    const { activeEventId, isLoadingEvents } = useEventContext();
    const [tickets, setTickets] = useState<AdminTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginatedResponse<AdminTicket>['meta'] | null>(null);
    const limit = 50;

    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        try {
            setExporting(true);
            await apiService.exportAdminTickets(activeEventId || undefined);
        } catch (err: any) {
            alert(err.message || 'Failed to export tickets');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        if (isLoadingEvents) return;
        const controller = new AbortController();
        setLoading(true);
        apiService
            .getAdminTickets(page, limit, controller.signal, undefined, activeEventId || undefined)
            .then((res) => {
                setTickets(res.data);
                setMeta(res.meta);
                setError('');
            })
            .catch((e: unknown) => {
                if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') return;
                setError('Failed to load tickets');
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [page, activeEventId, isLoadingEvents]);

    useEffect(() => {
        setPage(1);
    }, [activeEventId]);

    const filtered = tickets.filter((t) =>
        t.visitorName.toLowerCase().includes(query.toLowerCase()) ||
        t.passNumber.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-900">Tickets</h1>
                    <p className="mt-1 text-sm text-gray-600">Overview of all issued passes and their status.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2b3970] disabled:opacity-50"
                >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex gap-2">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 pl-9 text-sm focus:border-primary focus:outline-none"
                            placeholder="Search by visitor name or ticket number"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader size="md" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Visitor</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket Detail</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Issued On</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filtered.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <p className="font-semibold text-gray-900">{ticket.visitorName}</p>
                                                <p className="font-mono text-[11px] text-gray-500">{ticket.passNumber}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                <span className="capitalize">{ticket.ticketType} Ticket</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="font-medium text-gray-700">{ticket.eventName}</p>
                                                <p className="text-[11px] text-gray-500">{ticket.venue}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">
                                                {new Date(ticket.issuedAt).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ticket.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 px-1">
                                <div className="text-xs text-gray-500">
                                    Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold text-gray-900">{meta.total}</span> tickets
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1 || loading}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="flex items-center gap-1 px-2 text-xs font-medium text-gray-700">
                                        Page <span className="mx-1 text-sm font-bold text-gray-900">{page}</span> of {meta.totalPages}
                                    </div>
                                    <button
                                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages || loading}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
