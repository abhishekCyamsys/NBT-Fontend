import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsFeedback({
  message,
}: {
  message: { type: 'success' | 'error'; text: string } | null;
}) {
  if (!message) return null;

  return (
    <div
      className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
        message.type === 'success'
          ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
          : 'border-rose-100 bg-rose-50 text-rose-800'
      }`}
    >
      {message.type === 'success' ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <p className="text-sm font-medium">{message.text}</p>
    </div>
  );
}
