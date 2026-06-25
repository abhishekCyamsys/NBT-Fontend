import { useEffect, useState } from 'react';
import { Save, Phone, Loader2, Plus, Trash2, Pencil, X } from 'lucide-react';
import { apiService, type AdminEvent, type WhatsappEventConfig } from '../../../services/api';
import Loader from '../../../components/Loader';
import SettingsFeedback from './SettingsFeedback';

const emptyEventConfigForm = {
  whatsappNumber: '',
  eventId: '',
  childCount: 2,
  isActive: true,
};

export default function WhatsappEventRoutingPage() {
  const [whatsappEventConfigs, setWhatsappEventConfigs] = useState<WhatsappEventConfig[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventConfigForm, setEventConfigForm] = useState(emptyEventConfigForm);
  const [editingEventConfigId, setEditingEventConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEventConfig, setIsSavingEventConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([apiService.getWhatsappEventConfigs(), apiService.getAdminEvents()])
      .then(([eventConfigs, eventList]) => {
        setWhatsappEventConfigs(eventConfigs);
        setEvents(eventList);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load WhatsApp event routing.' }))
      .finally(() => setIsLoading(false));
  }, []);

  const resetEventConfigForm = () => {
    setEventConfigForm(emptyEventConfigForm);
    setEditingEventConfigId(null);
  };

  const handleSaveEventConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEventConfig(true);
    setMessage(null);
    try {
      if (editingEventConfigId) {
        const updated = await apiService.updateWhatsappEventConfig(editingEventConfigId, eventConfigForm);
        setWhatsappEventConfigs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setMessage({ type: 'success', text: 'WhatsApp event mapping updated successfully!' });
      } else {
        const created = await apiService.createWhatsappEventConfig(eventConfigForm);
        setWhatsappEventConfigs((prev) => [created, ...prev]);
        setMessage({ type: 'success', text: 'WhatsApp event mapping created successfully!' });
      }
      resetEventConfigForm();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save WhatsApp event mapping.' });
    } finally {
      setIsSavingEventConfig(false);
    }
  };

  const handleEditEventConfig = (config: WhatsappEventConfig) => {
    setEditingEventConfigId(config.id);
    setEventConfigForm({
      whatsappNumber: config.whatsappNumber,
      eventId: config.eventId,
      childCount: config.childCount,
      isActive: config.isActive,
    });
  };

  const handleDeleteEventConfig = async (configId: string) => {
    if (!window.confirm('Delete this WhatsApp event mapping?')) return;
    setMessage(null);
    try {
      await apiService.deleteWhatsappEventConfig(configId);
      setWhatsappEventConfigs((prev) => prev.filter((item) => item.id !== configId));
      if (editingEventConfigId === configId) {
        resetEventConfigForm();
      }
      setMessage({ type: 'success', text: 'WhatsApp event mapping deleted.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete WhatsApp event mapping.' });
    }
  };

  const handleToggleEventConfig = async (config: WhatsappEventConfig) => {
    setMessage(null);
    try {
      const updated = await apiService.updateWhatsappEventConfig(config.id, { isActive: !config.isActive });
      setWhatsappEventConfigs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (editingEventConfigId === config.id) {
        setEventConfigForm((prev) => ({ ...prev, isActive: updated.isActive }));
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update mapping status.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div>
      <SettingsFeedback message={message} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="rounded-lg bg-violet-100 p-2">
            <Phone className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp Event Routing</h2>
            <p className="text-xs text-slate-500">
              Map each WhatsApp business number to an event. Incoming messages on that number start
              registration for the linked event.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {whatsappEventConfigs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">WhatsApp Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Event</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Max Children</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {whatsappEventConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{config.whatsappNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{config.eventName}</div>
                        {config.eventSlug && (
                          <div className="text-xs text-slate-400">/{config.eventSlug}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{config.childCount}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleToggleEventConfig(config)}
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            config.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {config.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditEventConfig(config)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteEventConfig(config.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No WhatsApp event mappings yet. Add one below to route incoming messages to an event.
            </div>
          )}

          <form onSubmit={handleSaveEventConfig} className="space-y-5 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingEventConfigId ? 'Edit Mapping' : 'Add Mapping'}
              </h3>
              {editingEventConfigId && (
                <button
                  type="button"
                  onClick={resetEventConfigForm}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">WhatsApp Business Number</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  value={eventConfigForm.whatsappNumber}
                  onChange={(e) =>
                    setEventConfigForm((prev) => ({
                      ...prev,
                      whatsappNumber: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="918510071360"
                />
                <p className="text-xs text-slate-400">
                  Digits only, including country code. Must match the Gupshup destination number.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Event</label>
                <select
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  value={eventConfigForm.eventId}
                  onChange={(e) => setEventConfigForm((prev) => ({ ...prev, eventId: e.target.value }))}
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName}
                      {event.status ? ` (${event.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Max Children (WhatsApp registration)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={20}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  value={eventConfigForm.childCount}
                  onChange={(e) =>
                    setEventConfigForm((prev) => ({ ...prev, childCount: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                  value={eventConfigForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEventConfigForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={isSavingEventConfig}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingEventConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingEventConfigId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingEventConfigId ? 'Update Mapping' : 'Add Mapping'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
