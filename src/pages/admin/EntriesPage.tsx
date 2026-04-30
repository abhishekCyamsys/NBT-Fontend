import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiService, type AdminEntry, type PaginatedResponse } from '../../services/api';
import { useEventContext } from '../../context/EventContext';
import Loader from '../../components/Loader';

export default function EntriesPage() {
    const { activeEventId, isLoadingEvents } = useEventContext();
    const [entries, setEntries] = useState<AdminEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginatedResponse<AdminEntry>['meta'] | null>(null);
    const limit = 50;

    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        try {
            setExporting(true);
            await apiService.exportAdminEntries(activeEventId || undefined);
        } catch (err: any) {
            alert(err.message || 'Failed to export entries');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        if (isLoadingEvents) return;
        const controller = new AbortController();
        setLoading(true);
        apiService
            .getAdminEntries(page, limit, controller.signal, undefined, activeEventId || undefined)
            .then((res) => {
                setEntries(res.data);
                setMeta(res.meta);
                setError('');
            })
            .catch((e: unknown) => {
                if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') return;
                setError('Failed to load entries');
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [page, activeEventId, isLoadingEvents]);

    useEffect(() => {
        setPage(1);
    }, [activeEventId]);

    const filtered = entries.filter((e) =>
        e.visitorName.toLowerCase().includes(query.toLowerCase()) ||
        e.ticketId.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-900">Entry Logs</h1>
                    <p className="mt-1 text-sm text-gray-600">Track all entry activity across event locations.</p>
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
                            placeholder="Search by visitor name or ticket ID"
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
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket Type</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Entry Time</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filtered.map((entry) => (
                                        <tr key={entry.entryLogId} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <p className="font-semibold text-gray-900">{entry.visitorName}</p>
                                                <p className="text-[11px] text-gray-500">{entry.ticketId}</p>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="capitalize">{entry.ticketType}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="font-medium text-gray-700">{entry.eventName}</p>
                                                <p className="text-[11px] text-gray-500">{entry.venue}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">
                                                {new Date(entry.entryTime).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${entry.scanStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {entry.scanStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-xs text-gray-500">
                                    Page <span className="font-bold text-gray-900">{page}</span> of {meta.totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
                                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
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
