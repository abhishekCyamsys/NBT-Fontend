import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService, type AdminVolunteer, type AdminCreateVolunteerPayload, type PaginatedResponse } from '../../services/api';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<AdminVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AdminCreateVolunteerPayload>({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<AdminVolunteer>['meta'] | null>(null);
  const limit = 50;

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    apiService
      .getAdminVolunteers(page, limit, signal, [
        'id',
        'name',
        'email',
        'mobileNumber',
        'status',
        'createdAt',
      ])
      .then((res) => {
        setVolunteers(res.data);
        setMeta(res.meta);
        setError('');
      })
      .catch((e: unknown) => {
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') return;
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to load volunteers';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.createAdminVolunteer(form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', mobileNumber: '' });
      load();
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Failed to create volunteer';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Volunteers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage volunteer accounts used for gate operations.</p>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <div className="text-right text-xs text-gray-500">
              Total Volunteers: <span className="font-semibold text-gray-900">{meta.total}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#B30447] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#9a033c]"
          >
            <Plus className="h-4 w-4" />
            Add Volunteer
          </button>
        </div>
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
        ) : volunteers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No volunteers created yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mobile
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {volunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-900 font-semibold">{v.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-700">{v.email}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-700">+{v.mobileNumber}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            v.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 px-1">
                <div className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold text-gray-900">{meta.total}</span> volunteers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-[#B30447] hover:text-[#B30447] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1 px-2 text-xs font-medium text-gray-700">
                    Page <span className="mx-1 text-sm font-bold text-gray-900">{page}</span> of {meta.totalPages}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-[#B30447] hover:text-[#B30447] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-gray-900">Add Volunteer</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Mobile Number</label>
                <input
                  value={form.mobileNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    }))
                  }
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-[#B30447] px-3 py-2 text-sm font-semibold text-white shadow hover:bg-[#9a033c] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

