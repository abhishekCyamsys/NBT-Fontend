import { useEffect, useState } from 'react';
import { CalendarPlus, Ban } from 'lucide-react';
import { apiService, type AdminEvent, type AdminCreateEventPayload } from '../../services/api';

export default function EventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AdminCreateEventPayload>({
    name: '',
    location: '',
    venue: '',
    description: '',
    agenda: '',
    bannerUrl: '',
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await apiService.getAdminEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiService.createAdminEvent(form);
      setEvents((prev) => [
        ...prev,
        { id: res.id, eventName: form.name, ...form },
      ]);
      setForm({ name: '', location: '', venue: '', description: '', agenda: '', bannerUrl: '', startDate: '', endDate: '' });
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as { message?: unknown }).message) : 'Failed to create event';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    try {
      await apiService.deactivateAdminEvent(id);
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: 'inactive' } : e));
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as { message?: unknown }).message) : 'Failed to deactivate event';
      alert(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-600">Create and manage book fair events.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CalendarPlus className="h-4 w-4 text-[#B30447]" />
            Create Event
          </h2>
          <form onSubmit={create} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Venue</label>
                <input
                  value={form.venue || ''}
                  onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Agenda</label>
              <textarea
                value={form.agenda || ''}
                onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Banner URL</label>
              <input
                value={form.bannerUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#B30447] px-3 py-2 text-sm font-semibold text-white shadow hover:bg-[#9a033c] disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Existing Events</h2>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B30447]" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No events created yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {events.map((e) => (
                <div key={e.id} className="flex flex-col justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-gray-900 flex items-center justify-between">
                      {e.eventName}
                      {e.status === 'inactive' && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 uppercase">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">{e.venue ? `${e.venue}, ` : ''}{e.location}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(e.startDate).toLocaleString()} – {new Date(e.endDate).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deactivate(e.id)}
                    disabled={e.status === 'inactive'}
                    className="mt-3 inline-flex w-fit items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Ban className="h-3 w-3" />
                    {e.status === 'inactive' ? 'Deactivated' : 'Deactivate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

