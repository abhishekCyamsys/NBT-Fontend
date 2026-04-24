import { useEffect, useState } from 'react';
import { Save, MessageSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

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

export default function SettingsPage() {
  const [config, setConfig] = useState<WhatsappConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await apiService.getWhatsappSettings();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch WhatsApp config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await apiService.updateWhatsappSettings(config);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#334383]" />
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

        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Basic Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Basic Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Configuration Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.configName || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, configName: e.target.value } : null)}
                  placeholder="e.g. Production Gupshup"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">App Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.appName || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, appName: e.target.value } : null)}
                  placeholder="Your Gupshup App Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Source Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.sourceNumber || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, sourceNumber: e.target.value } : null)}
                  placeholder="e.g. 918510071360"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Authentication Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Authentication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">API Key</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.apiKey || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                  placeholder="sk_..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">API Key Header</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.apiKeyHeader || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, apiKeyHeader: e.target.value } : null)}
                  placeholder="apikey"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">API Key Prefix</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.apiKeyPrefix || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, apiKeyPrefix: e.target.value } : null)}
                  placeholder="e.g. Bearer (Optional)"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* URL Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Endpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Base URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.baseUrl || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, baseUrl: e.target.value } : null)}
                  placeholder="https://api.gupshup.io"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message API URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#334383] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={config?.messageApiUrl || ''}
                  onChange={e => setConfig(prev => prev ? { ...prev, messageApiUrl: e.target.value } : null)}
                  placeholder="https://api.gupshup.io/wa/api/v1/msg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-[#334383] text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-[#28356a] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
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
              Updating these credentials will take effect immediately across all WhatsApp communication channels. 
              Ensure you have verified the Gupshup App Name and API Key. 
              The Message API URL is typically constructed from the Base URL, but can be overridden if needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
