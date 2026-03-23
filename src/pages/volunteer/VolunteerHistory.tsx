import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';

export default function VolunteerHistory() {
  // TODO: integrate backend entry logs if available; otherwise keep local persistence.
  const items: Array<{ ts: string; status: string; label: string }> = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-white px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/volunteer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B30447] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-gray-900">Scan History</p>
            <p className="text-xs text-gray-600">Recent validations</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-[#B30447]" />
            <p className="font-semibold text-gray-900">Recent Scans</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              No scan history yet. This will populate once scanning is integrated.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.ts} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{it.label}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {it.ts} · {it.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

