import { useEffect, useMemo, useState } from 'react';
import { Users, ClipboardList, Ticket, ScanLine, Baby, UserPlus } from 'lucide-react';
import { BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService, type AdminDashboardStats } from '../../services/api';

const PIE_COLORS = ['#B30447', '#D23769', '#F06A8C', '#FFA1B6', '#FFD1DA', '#990033', '#660022'];

export default function DashboardHome() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiService.getAdminDashboard()
      .then((dashboardData) => {
        if (!cancelled) {
          setStats(dashboardData);
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load dashboard';
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

  const demographicsData = useMemo(() => {
    if (!stats?.visitorAgeDistribution) return [];
    return stats.visitorAgeDistribution
      .map(d => ({ name: d.age || 'Unknown', value: d.count }))
      .sort((a, b) => b.value - a.value);
  }, [stats?.visitorAgeDistribution]);

  const genderData = useMemo(() => {
    if (!stats?.visitorGenderDistribution) return [];
    return stats.visitorGenderDistribution
      .map(d => ({ name: d.gender || 'Unknown', value: d.count }))
      .sort((a, b) => b.value - a.value);
  }, [stats?.visitorGenderDistribution]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#B30447]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Visitors', value: stats?.totalVisitors ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Registrations', value: stats?.totalRegistrations ?? 0, icon: ClipboardList, color: 'bg-slate-700' },
    { label: 'Total Tickets', value: stats?.totalTickets ?? 0, icon: Ticket, color: 'bg-purple-500' },
    { label: 'Total Entries', value: stats?.totalEntries ?? 0, icon: ScanLine, color: 'bg-emerald-500' },
    { label: 'Children Tickets', value: stats?.childrenTickets ?? 0, icon: Baby, color: 'bg-amber-500' },
    { label: 'Volunteer Registrations', value: stats?.volunteerRegistrations ?? 0, icon: UserPlus, color: 'bg-rose-600' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Overview of live visitor and entry activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">{c.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
              <div className={`${c.color} inline-flex h-10 w-10 items-center justify-center rounded-xl text-white`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-gray-900">Visitors per day</h2>
          <p className="mt-1 text-xs text-gray-600">Daily registrations volume</p>

          {stats?.visitorsPerDay?.length ? (
            <div className="mt-4 h-64 text-xs font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.visitorsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="morningVisitors" name="Morning" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="eveningVisitors" name="Evening" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalVisitors" name="All (Total)" fill="#B30447" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No daily data yet.</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-gray-900">Demographics (Age)</h2>
          <p className="mt-1 text-xs text-gray-600">Visitor age distribution</p>

          {demographicsData.length > 0 ? (
            <div className="mt-4 flex flex-col items-center">
              <div className="h-48 w-full font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {demographicsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold', color: '#111827' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {demographicsData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                    <span className="text-gray-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No demographic data yet.</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-gray-900">Demographics (Gender)</h2>
          <p className="mt-1 text-xs text-gray-600">Visitor gender distribution</p>

          {genderData.length > 0 ? (
            <div className="mt-4 flex flex-col items-center">
              <div className="h-48 w-full font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3B82F6' : entry.name === 'Female' ? '#EC4899' : PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold', color: '#111827' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {genderData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.name === 'Male' ? '#3B82F6' : entry.name === 'Female' ? '#EC4899' : PIE_COLORS[index % PIE_COLORS.length] }}></span>
                    <span className="text-gray-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No gender data yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-gray-900">Visitors per event</h2>
          <p className="mt-1 text-xs text-gray-600">Event-wise visitor count</p>

          {stats?.visitorsPerEvent?.length ? (
            <div className="mt-4 space-y-2">
              {stats.visitorsPerEvent.map((e) => (
                <div key={e.eventId} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{e.eventName}</p>
                    <p className="truncate font-mono text-[11px] text-gray-500">{e.eventSlug}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-[#B30447]">
                    {e.visitors}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No event data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-gray-900">Event analytics</h2>
        <p className="mt-1 text-xs text-gray-600">Tickets, entries, children tickets, volunteer registrations</p>

        {!stats?.eventAnalytics?.length ? (
          <p className="mt-4 text-sm text-gray-500">No analytics data yet.</p>
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
                  {stats.eventAnalytics.map((a) => (
                    <tr key={a.eventId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{a.eventName}</p>
                        <p className="font-mono text-[11px] text-gray-500">{a.slug}</p>
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
              {stats.eventAnalytics.map((a) => (
                <div key={a.eventId} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-display text-sm font-bold text-gray-900">{a.eventName}</p>
                  <p className="mt-1 font-mono text-[11px] text-gray-500 break-all">{a.slug}</p>
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
    </div>
  );
}

