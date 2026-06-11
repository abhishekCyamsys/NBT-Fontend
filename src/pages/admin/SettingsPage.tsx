import { useEffect, useState } from 'react';
import { Save, MessageSquare, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Pencil, X, Phone } from 'lucide-react';
import { apiService, type AdminEvent, type WhatsappEventConfig } from '../../services/api';
import Loader from '../../components/Loader';

interface WhatsappConfig {
  configName: string;
  apiKey: string;
  apiKeyHeader: string;
  apiKeyPrefix: string;
  appName: string;
  sourceNumber: string;
  baseUrl: string;
  messageApiUrl: string;
  isActive: boolean;
}

interface SmsConfig {
  configName: string;
  apiUrl: string;
  apiKey: string;
  senderName: string;
  templateId: string;
  isActive: boolean;
}

const emptyEventConfigForm = {
  whatsappNumber: '',
  eventId: '',
  childCount: 2,
  isActive: true,
};

export default function SettingsPage() {
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [whatsappEventConfigs, setWhatsappEventConfigs] = useState<WhatsappEventConfig[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventConfigForm, setEventConfigForm] = useState(emptyEventConfigForm);
  const [editingEventConfigId, setEditingEventConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEventConfig, setIsSavingEventConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [waData, smsData, eventConfigs, eventList] = await Promise.all([
        apiService.getWhatsappSettings(),
        apiService.getSmsSettings(),
        apiService.getWhatsappEventConfigs(),
        apiService.getAdminEvents(),
      ]);
      setWhatsappConfig(waData);
      setSmsConfig(smsData);
      setWhatsappEventConfigs(eventConfigs);
      setEvents(eventList);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappConfig) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await apiService.updateWhatsappSettings(whatsappConfig);
      setMessage({ type: 'success', text: 'WhatsApp settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update WhatsApp settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsConfig) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await apiService.updateSmsSettings(smsConfig);
      setMessage({ type: 'success', text: 'SMS settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update SMS settings.' });
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your system configurations and integrations.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* WhatsApp Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp Configuration</h2>
            <p className="text-xs text-slate-500">Configure Gupshup API credentials for WhatsApp messaging.</p>
          </div>
        </div>

        <form onSubmit={handleSaveWhatsapp} className="p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Basic Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">App Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={whatsappConfig?.appName || ''}
                  onChange={e => setWhatsappConfig(prev => prev ? { ...prev, appName: e.target.value } : null)}
                  placeholder="NBTWhatsappReg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Source Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={whatsappConfig?.sourceNumber || ''}
                  onChange={e => setWhatsappConfig(prev => prev ? { ...prev, sourceNumber: e.target.value } : null)}
                  placeholder="918510071360"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Authentication & Endpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">API Key</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={whatsappConfig?.apiKey || ''}
                  onChange={e => setWhatsappConfig(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                  placeholder="sk_..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message API URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={whatsappConfig?.messageApiUrl || ''}
                  onChange={e => setWhatsappConfig(prev => prev ? { ...prev, messageApiUrl: e.target.value } : null)}
                  placeholder="https://api.gupshup.io/wa/api/v1/msg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">API Key Header</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={whatsappConfig?.apiKeyHeader || ''}
                  onChange={e => setWhatsappConfig(prev => prev ? { ...prev, apiKeyHeader: e.target.value } : null)}
                  placeholder="apikey"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save WhatsApp Settings
            </button>
          </div>
        </form>
      </section>

      {/* WhatsApp Event Routing */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Phone className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp Event Routing</h2>
            <p className="text-xs text-slate-500">
              Map each WhatsApp business number to an event. Incoming messages on that number start registration for the linked event.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

          <form onSubmit={handleSaveEventConfig} className="rounded-xl border border-slate-200 p-5 space-y-5">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">WhatsApp Business Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={eventConfigForm.whatsappNumber}
                  onChange={(e) => setEventConfigForm((prev) => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="918510071360"
                />
                <p className="text-xs text-slate-400">Digits only, including country code. Must match the Gupshup destination number.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Event</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                  value={eventConfigForm.eventId}
                  onChange={(e) => setEventConfigForm((prev) => ({ ...prev, eventId: e.target.value }))}
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName}{event.status ? ` (${event.status})` : ''}
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
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={eventConfigForm.childCount}
                  onChange={(e) => setEventConfigForm((prev) => ({ ...prev, childCount: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                  value={eventConfigForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEventConfigForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
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
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

      {/* SMS Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Save className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">SMS Configuration</h2>
            <p className="text-xs text-slate-500">Configure Muzztech API credentials for SMS messaging.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSms} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">API URL</label>
              <input
                type="url"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={smsConfig?.apiUrl || ''}
                onChange={e => setSmsConfig(prev => prev ? { ...prev, apiUrl: e.target.value } : null)}
                placeholder="https://connect.muzztech.com/api/sms/send"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={smsConfig?.apiKey || ''}
                onChange={e => setSmsConfig(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                placeholder="Your SMS API Key"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sender Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={smsConfig?.senderName || ''}
                onChange={e => setSmsConfig(prev => prev ? { ...prev, senderName: e.target.value } : null)}
                placeholder="CYMSYS"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Template ID</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
                value={smsConfig?.templateId || ''}
                onChange={e => setSmsConfig(prev => prev ? { ...prev, templateId: e.target.value } : null)}
                placeholder="Optional Template ID"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save SMS Settings
            </button>
          </div>
        </form>
      </section>

      <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 border-dashed">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-slate-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Security Warning</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Updating these credentials will take effect immediately across all communication channels. 
              Ensure you have verified the API keys and endpoints before saving.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
