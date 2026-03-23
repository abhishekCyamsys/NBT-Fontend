import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BadgeCheck, Lock, User } from 'lucide-react';
import { apiService } from '../../services/api';

export default function VolunteerLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.volunteerLogin({ email: form.email, password: form.password });
      navigate('/volunteer');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[#B30447] px-6 py-5 shadow-lg">
            <img src="/NBTlogo.png" alt="NBT Logo" className="h-14 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Volunteer Login</h1>
          <p className="mt-1 text-sm text-slate-300">Sign in to scan and manage entries.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#B30447] transition"
                  placeholder="volunteer@nbt.local"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#B30447] transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#B30447] px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-[#9a033c] disabled:opacity-50"
              type="submit"
            >
              <BadgeCheck className="h-5 w-5" />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/" className="text-sm font-medium text-[#B30447] hover:underline">
              Back to role selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

