import { useEffect, useState } from 'react';
import { Save, Globe, Loader2, Info } from 'lucide-react';
import { apiService, type PlatformSettings } from '../../../services/api';
import Loader from '../../../components/Loader';
import SettingsFeedback from './SettingsFeedback';

export default function EventBaseUrlSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [eventBaseUrl, setEventBaseUrl] = useState('');
  const [syncExistingEvents, setSyncExistingEvents] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiService
      .getPlatformSettings()
      .then((data) => {
        setSettings(data);
        setEventBaseUrl(data.eventBaseUrl || '');
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load event base URL settings.' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await apiService.updatePlatformSettings({
        eventBaseUrl,
        syncExistingEvents,
      });
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              eventBaseUrl: result.eventBaseUrl,
              source: 'database',
            }
          : null,
      );
      const syncNote =
        result.syncedEventCount > 0
          ? ` Updated ${result.syncedEventCount} existing event(s).`
          : '';
      setMessage({
        type: 'success',
        text: `Event base URL saved successfully.${syncNote}`,
      });
      setSyncExistingEvents(false);
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update event base URL.' });
    } finally {
      setIsSaving(false);
    }
  };

  const previewUrl = eventBaseUrl
    ? `${eventBaseUrl.replace(/\/+$/g, '')}/register/your-event-slug`
    : '';

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
          <div className="rounded-lg bg-sky-100 p-2">
            <Globe className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Event Base URL</h2>
            <p className="text-xs text-slate-500">
              Public host used when generating visitor registration links for new events.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Base URL</label>
            <input
              type="url"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              value={eventBaseUrl}
              onChange={(e) => setEventBaseUrl(e.target.value.trim())}
              placeholder="https://nbt.cyamsys.com"
            />
            <p className="text-xs text-slate-400">
              No trailing slash. Example: <code className="text-slate-600">https://nbt.cyamsys.com</code>
            </p>
          </div>

          {settings?.source === 'environment' && settings.envFallback && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Currently using environment fallback: <span className="font-mono">{settings.envFallback}</span>.
              Save to store in the database.
            </div>
          )}

          {previewUrl && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registration URL format</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-700">{previewUrl}</p>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={syncExistingEvents}
              onChange={(e) => setSyncExistingEvents(e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Update all existing events</p>
              <p className="mt-1 text-xs text-slate-500">
                Applies this base URL to every non-deleted event so their registration links stay consistent.
              </p>
            </div>
          </label>

          <div className="flex items-center justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Event Base URL
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-slate-200 p-2">
            <Info className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">How registration links work</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              When you create a new event, the system stores this base URL and builds links as{' '}
              <span className="font-mono text-slate-600">{'{baseUrl}/register/{event-slug}'}</span>.
              Visitors open that link to start mobile OTP registration for the event.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
