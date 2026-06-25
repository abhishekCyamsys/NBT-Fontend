import { useEffect, useState } from 'react';
import { Save, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../../../services/api';
import Loader from '../../../components/Loader';
import SettingsFeedback from './SettingsFeedback';

interface SmsConfig {
  configName: string;
  apiUrl: string;
  apiKey: string;
  senderName: string;
  templateId: string;
  isActive: boolean;
}

export default function SmsSettingsPage() {
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiService
      .getSmsSettings()
      .then(setSmsConfig)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load SMS configuration.' }))
      .finally(() => setIsLoading(false));
  }, []);

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
    <div>
      <SettingsFeedback message={message} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">SMS Configuration</h2>
            <p className="text-xs text-slate-500">Configure Muzztech API credentials for SMS messaging.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSms} className="space-y-8 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">API URL</label>
              <input
                type="url"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                value={smsConfig?.apiUrl || ''}
                onChange={(e) => setSmsConfig((prev) => (prev ? { ...prev, apiUrl: e.target.value } : null))}
                placeholder="https://connect.muzztech.com/api/sms/send"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                value={smsConfig?.apiKey || ''}
                onChange={(e) => setSmsConfig((prev) => (prev ? { ...prev, apiKey: e.target.value } : null))}
                placeholder="Your SMS API Key"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sender Name</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                value={smsConfig?.senderName || ''}
                onChange={(e) =>
                  setSmsConfig((prev) => (prev ? { ...prev, senderName: e.target.value } : null))
                }
                placeholder="CYMSYS"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Template ID</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                value={smsConfig?.templateId || ''}
                onChange={(e) =>
                  setSmsConfig((prev) => (prev ? { ...prev, templateId: e.target.value } : null))
                }
                placeholder="Optional Template ID"
              />
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save SMS Settings
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-slate-200 p-2">
            <AlertCircle className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Security Warning</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Updating these credentials takes effect immediately across all communication channels.
              Verify API keys and endpoints before saving.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
