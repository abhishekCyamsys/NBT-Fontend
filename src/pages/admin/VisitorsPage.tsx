import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiService, type AdminVisitor, type PaginatedResponse } from '../../services/api';
import { useEventContext } from '../../context/EventContext';

export default function VisitorsPage() {
    const { activeEventId, isLoadingEvents } = useEventContext();
    const [visitors, setVisitors] = useState<AdminVisitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginatedResponse<AdminVisitor>['meta'] | null>(null);
    const limit = 50;

    const clearFilters = () => {
        setQuery('');
        setDateFilter('');
        setTimeFilter('');
        setSourceFilter('all');
    };

    const hasActiveFilters = Boolean(
        query || dateFilter || timeFilter || sourceFilter !== 'all'
    );

    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        try {
            setExporting(true);
            await apiService.exportAdminVisitors(activeEventId || undefined);
        } catch (err: any) {
            alert(err.message || 'Failed to export visitors');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        if (isLoadingEvents) return;
        const controller = new AbortController();
        setLoading(true);
        apiService
            .getAdminVisitors(page, limit, controller.signal, activeEventId || undefined)
            .then((res) => {
                setVisitors(res.data);
                setMeta(res.meta);
                setError('');
            })
            .catch((e: unknown) => {
                if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') return;
                const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load visitors';
                setError(msg);
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [page, activeEventId, isLoadingEvents]);

    // Reset to page 1 whenever the selected event changes
    useEffect(() => {
        setPage(1);
    }, [activeEventId]);

    const filtered = useMemo(() => {
        let result = visitors;

        if (sourceFilter !== 'all') {
            result = result.filter(v => (v.registrationSource || '').toLowerCase() === sourceFilter.toLowerCase());
        }

        if (dateFilter) {
            result = result.filter(v => {
                const d = new Date(v.createdAt);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}` === dateFilter;
            });
        }

        if (timeFilter) {
            result = result.filter(v => {
                const d = new Date(v.createdAt);
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${hh}:${mm}`.startsWith(timeFilter);
            });
        }

        const q = query.trim().toLowerCase();
        if (q) {
            result = result.filter((v) => {
                return (
                    v.name.toLowerCase().includes(q) ||
                    v.mobileNumber.toLowerCase().includes(q) ||
                    v.visitorId.toLowerCase().includes(q) ||
                    v.registrationId.toLowerCase().includes(q) ||
                    v.eventName.toLowerCase().includes(q)
                );
            });
        }

        return result;
    }, [query, visitors, sourceFilter, dateFilter, timeFilter]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-gray-900">Visitors</h1>
                    <p className="mt-1 text-sm text-gray-600">All registrations with profile and entry status.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {meta && (
                        <div className="text-right text-xs text-gray-500">
                            Total Registrations: <span className="font-semibold text-gray-900">{meta.total}</span>
                        </div>
                    )}
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2b3970] disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 pl-9 text-sm focus:border-primary focus:outline-none"
                                placeholder="Search by name, phone, or visitor ID"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors ${showFilters ? 'border-primary text-primary bg-blue-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Source</label>
                                <select
                                    value={sourceFilter}
                                    onChange={(e) => setSourceFilter(e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 p-2.5 text-sm focus:border-primary focus:ring-primary border bg-white"
                                >
                                    <option value="all">All Sources</option>
                                    <option value="web">Web</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Date</label>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 p-2.5 text-sm focus:border-primary focus:ring-primary border bg-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Time</label>
                                <input
                                    type="time"
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 p-2.5 text-sm focus:border-primary focus:ring-primary border bg-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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

                        {meta && meta.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 px-1">
                                <div className="text-xs text-gray-500">
                                    Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold text-gray-900">{meta.total}</span> visitors
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

