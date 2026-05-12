import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QrCode, UserPlus, LogOut, History, Users, ShieldAlert, Clock, Loader2 } from 'lucide-react';
import { apiService, VolunteerGateStats } from '../../services/api';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VolunteerGateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('volunteer_jwt');
    if (!token) {
      navigate('/volunteer/login', { replace: true });
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Try to get eventId from localStorage or fetch events
        let eventId = localStorage.getItem('scan_event_id');
        if (!eventId) {
          const events = await apiService.getVolunteerEvents();
          if (events.length > 0) {
            eventId = events[0].id || events[0].eventId;
            localStorage.setItem('scan_event_id', eventId);
          }
        }

        if (eventId) {
          const data = await apiService.getVolunteerGateStats(eventId);
          setStats(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch stats', err);
        setError(err.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const logout = () => {
    apiService.logoutVolunteer();
    navigate('/volunteer/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Volunteer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Fast actions and real-time gate management.</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Stats Section */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Entries Today</p>
            </div>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            ) : (
              <p className="text-4xl font-bold text-white">{stats?.totalEntriesToday ?? 0}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Duplicates Blocked</p>
            </div>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            ) : (
              <p className="text-4xl font-bold text-white">{stats?.duplicatesBlocked ?? 0}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-xl bg-green-500/10 p-3 text-green-500">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Last Scan</p>
            </div>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            ) : (
              <p className="text-lg font-bold text-white">
                {stats?.lastScanTime ? new Date(stats.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No scans'}
              </p>
            )}
          </div>
        </div>

        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/volunteer/scan"
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-all hover:bg-slate-800 hover:border-slate-700"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="rounded-xl bg-white/5 p-3 text-primary group-hover:bg-primary/10 transition-colors">
                <QrCode className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Scan QR Ticket</h3>
                <p className="mt-1 text-sm text-slate-400">Validate entry in under 300ms.</p>
              </div>
            </div>
          </Link>

          <Link
            to="/volunteer/register"
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-all hover:bg-slate-800 hover:border-slate-700"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="rounded-xl bg-white/5 p-3 text-primary group-hover:bg-primary/10 transition-colors">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">On-Spot Registration</h3>
                <p className="mt-1 text-sm text-slate-400">Quick registration for long queues.</p>
              </div>
            </div>
          </Link>

          <Link
            to="/volunteer/history"
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-all hover:bg-slate-800 hover:border-slate-700"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="rounded-xl bg-white/5 p-3 text-primary group-hover:bg-primary/10 transition-colors">
                <History className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Scan History</h3>
                <p className="mt-1 text-sm text-slate-400">Review recent scans and results.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

