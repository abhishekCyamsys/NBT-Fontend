import { useEffect, useState } from 'react';
import { Save, MessageSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
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

export default function SettingsPage() {
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [waData, smsData] = await Promise.all([
        apiService.getWhatsappSettings(),
        apiService.getSmsSettings()
      ]);
      setWhatsappConfig(waData);
      setSmsConfig(smsData);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration.' });
    } finally {
      setIsLoading(false);
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
