import { useEffect, useState } from 'react';
import { apiService, type AdminAnalytics } from '../../services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService
      .getAdminAnalytics()
      .then((data) => {
        setAnalytics(data);
        setError('');
      })
      .catch((e: unknown) => {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load analytics';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#334383]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">Event-level metrics and daily visitor trends.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-gray-900">Visitors per day</h2>
        <p className="mt-1 text-xs text-gray-600">Daily registrations volume</p>
        {analytics.visitorsPerDay?.length ? (
          <div className="mt-4 space-y-2">
            {analytics.visitorsPerDay.map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="font-mono text-xs text-gray-600">{d.date}</span>
                <span className="text-sm font-bold text-gray-900">{d.totalVisitors}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No daily data yet.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-gray-900">Event analytics</h2>
        <p className="mt-1 text-xs text-gray-600">Visitors, tickets, entries, children tickets</p>

        {!analytics.eventAnalytics?.length ? (
          <p className="mt-4 text-sm text-gray-500">No event analytics data yet.</p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Visitors</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Tickets</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Entries</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Children</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Volunteer Reg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.eventAnalytics.map((a) => (
                    <tr key={a.eventId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{a.eventName}</p>
                        <p className="font-mono text-[11px] text-gray-500">{a.eventId}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{a.visitors}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{a.totalTickets}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{a.totalEntries}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{a.childrenTickets}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{a.volunteerRegistrations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:hidden">
              {analytics.eventAnalytics.map((a) => (
                <div key={a.eventId} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-display text-sm font-bold text-gray-900">{a.eventName}</p>
                  <p className="mt-1 font-mono text-[11px] text-gray-500 break-all">{a.eventId}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Visitors</p>
                      <p className="text-sm font-bold text-gray-900">{a.visitors}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Tickets</p>
                      <p className="text-sm font-bold text-gray-900">{a.totalTickets}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Entries</p>
                      <p className="text-sm font-bold text-gray-900">{a.totalEntries}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Children</p>
                      <p className="text-sm font-bold text-gray-900">{a.childrenTickets}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 col-span-2">
                      <p className="text-gray-500">Volunteer Registrations</p>
                      <p className="text-sm font-bold text-gray-900">{a.volunteerRegistrations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Volunteer Registrations (total)</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.volunteerRegistrations}</p>
      </div>
    </div>
  );
}

