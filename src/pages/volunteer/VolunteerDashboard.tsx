import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QrCode, UserPlus, LogOut } from 'lucide-react';

export default function VolunteerDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('volunteer_jwt');
    if (!token) {
      navigate('/volunteer/login', { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('volunteer_jwt');
    navigate('/volunteer/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">Volunteer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">Fast actions for entry gates.</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/volunteer/scan"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:bg-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-[#334383]">
                <QrCode className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold">Scan QR Ticket</h2>
                <p className="mt-1 text-sm text-slate-300">Validate entry in under 300ms.</p>
              </div>
            </div>
          </Link>

          <Link
            to="/volunteer/register"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:bg-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-[#334383]">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold">On-Spot Registration</h2>
                <p className="mt-1 text-sm text-slate-300">Quick registration for long queues.</p>
              </div>
            </div>
          </Link>

          {/* <Link
            to="/volunteer/history"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:bg-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-[#334383]">
                <History className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold">Scan History</h2>
                <p className="mt-1 text-sm text-slate-300">Review recent scans and results.</p>
              </div>
            </div>
          </Link> */}
        </div>
      </div>
    </div>
  );
}

