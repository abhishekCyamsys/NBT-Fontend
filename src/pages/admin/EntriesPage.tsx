import { useEffect, useState } from 'react';
import { apiService, type AdminEntry } from '../../services/api';

export default function EntriesPage() {
  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService
      .getAdminEntries()
      .then((res) => {
        setEntries(res.data);
        setError('');
      })
      .catch((e: unknown) => {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load entries';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Entries</h1>
        <p className="mt-1 text-sm text-gray-600">Scan logs across all gates and devices.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B30447]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No entry logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Visitor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ticket ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Event
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Scan Detail
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((e) => (
                  <tr key={e.entryLogId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-gray-900">
                      {e.visitorName}
                      <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {e.ticketType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-600">
                      {e.ticketId.split('-')[0]}...
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                      <div>{e.eventName}</div>
                      <div className="text-[10px] text-gray-500">{e.venue}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                      <div>{e.scanDeviceId}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                      {new Date(e.entryTime).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                       <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${e.scanStatus === 'success' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                        {e.scanStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

