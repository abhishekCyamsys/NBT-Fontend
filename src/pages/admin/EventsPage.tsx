import { useEffect, useState } from 'react';
import { CalendarPlus, Ban, Eye, X, Trash2, Edit2 } from 'lucide-react';
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<AdminEvent | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminCreateEventPayload>>({});
  const [savingEdit, setSavingEdit] = useState(false);

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

  const deleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await apiService.deleteAdminEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as { message?: unknown }).message) : 'Failed to delete event';
      if (msg.includes('Deactivate it instead')) {
        if (window.confirm('This event has registrations and cannot be deleted. Do you want to deactivate it instead?')) {
          void deactivate(id);
        }
      } else {
        alert(msg);
      }
    }
  };

  const openDetails = async (id: string) => {
    setSelectedEventId(id);
    setLoadingDetails(true);
    setSelectedEventDetails(null);
    setIsEditing(false);
    try {
      const details = await apiService.getAdminEventById(id);
      setSelectedEventDetails(details);
    } catch (er) {
      console.error(er);
      alert('Failed to load event details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedEventId(null);
    setIsEditing(false);
    setTimeout(() => setSelectedEventDetails(null), 300); // clear after animation
  };

  const startEditing = () => {
    if (!selectedEventDetails) return;
    setEditForm({
      name: selectedEventDetails.eventName,
      location: selectedEventDetails.location,
      venue: selectedEventDetails.venue || '',
      description: selectedEventDetails.description || '',
      agenda: selectedEventDetails.agenda || '',
      bannerUrl: selectedEventDetails.bannerUrl || '',
      startDate: selectedEventDetails.startDate ? new Date(selectedEventDetails.startDate).toISOString().slice(0, 16) : '',
      endDate: selectedEventDetails.endDate ? new Date(selectedEventDetails.endDate).toISOString().slice(0, 16) : '',
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedEventId) return;
    setSavingEdit(true);
    try {
      const updatedEvent = await apiService.updateAdminEvent(selectedEventId, editForm);
      setSelectedEventDetails(updatedEvent);
      setEvents((prev) => prev.map(e => e.id === selectedEventId ? { ...updatedEvent, name: updatedEvent.eventName } : e));
      setIsEditing(false);
    } catch (er) {
      const msg = er && typeof er === 'object' && 'message' in er ? String((er as { message?: unknown }).message) : 'Failed to update event';
      alert(msg);
    } finally {
      setSavingEdit(false);
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
                    <p className="mt-1 text-xs text-gray-500">slug: {e.slug}</p>
                    <p className="mt-1 text-xs text-gray-600">{e.venue ? `${e.venue}, ` : ''}{e.location}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(e.startDate).toLocaleString()} – {new Date(e.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openDetails(e.id)}
                      title="View Details"
                      className="inline-flex w-fit items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deactivate(e.id)}
                      disabled={e.status === 'inactive'}
                      title={e.status === 'inactive' ? 'Deactivated' : 'Deactivate Event'}
                      className="inline-flex w-fit items-center justify-center rounded-lg border border-orange-200 p-2 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(e.id)}
                      disabled={e.hasRegistrations}
                      title={e.hasRegistrations ? "Cannot delete: Event has active registrations" : "Delete Event"}
                      className="inline-flex w-fit items-center justify-center rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flyout Panel for Details */}
      <div
        className={`fixed inset-0 z-50 transform pointer-events-auto transition-transform duration-300 ease-in-out ${selectedEventId ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${selectedEventId ? 'bg-black/30 opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={closeDetails}
        />
        <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl flex flex-col pointer-events-auto border-l border-gray-200">
          <div className="flex items-center justify-between border-b px-6 py-5 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
            <button onClick={closeDetails} className="text-gray-500 hover:text-gray-700 bg-gray-200 p-1.5 rounded-full hover:bg-gray-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {loadingDetails ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B30447]" />
              </div>
            ) : selectedEventDetails ? (
              isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 border-b border-gray-200 -mx-6 -mt-6 px-6 mb-4">
                    <h3 className="font-bold text-gray-900">Edit Event</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled={savingEdit}>Cancel</button>
                      <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#B30447] text-white hover:bg-[#9a033c] disabled:opacity-50" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Name</label>
                    <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Location</label>
                      <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.location || ''} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Venue</label>
                      <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.venue || ''} onChange={(e) => setEditForm((p) => ({ ...p, venue: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
                    <textarea className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" rows={3} value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Agenda</label>
                    <textarea className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" rows={3} value={editForm.agenda || ''} onChange={(e) => setEditForm((p) => ({ ...p, agenda: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Banner URL</label>
                    <input className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.bannerUrl || ''} onChange={(e) => setEditForm((p) => ({ ...p, bannerUrl: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Start Date</label>
                      <input type="datetime-local" className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.startDate || ''} onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">End Date</label>
                      <input type="datetime-local" className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#B30447] focus:outline-none" value={editForm.endDate || ''} onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Event Name</h3>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{selectedEventDetails.eventName}</p>
                      <p className="text-sm font-medium text-[#B30447] mt-1">/{selectedEventDetails.slug}</p>
                    </div>
                    <button
                      onClick={startEditing}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {selectedEventDetails.bannerUrl && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Banner</h3>
                      <img
                        src={selectedEventDetails.bannerUrl}
                        alt="Event Banner"
                        className="rounded-xl max-h-56 object-cover w-full border border-gray-100 shadow-sm"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</h3>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {selectedEventDetails.description || <span className="italic text-gray-400">No description provided.</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Agenda</h3>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {selectedEventDetails.agenda || <span className="italic text-gray-400">No agenda provided.</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Location</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedEventDetails.location}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Venue</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedEventDetails.venue || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Start Date</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">{new Date(selectedEventDetails.startDate).toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">End Date</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">{new Date(selectedEventDetails.endDate).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Registration Link</h3>
                      <a
                        href={selectedEventDetails.registerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm font-bold text-[#B30447] hover:underline"
                      >
                        {selectedEventDetails.registerUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                No event selected or failed to load.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

