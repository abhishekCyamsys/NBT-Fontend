import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { apiService } from '../../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.adminLogin({ email: form.email, password: form.password });
      navigate('/admin/dashboard', { replace: true });
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-[#B30447] px-6 py-5 shadow-lg">
            <img src="/NBTlogo.png" alt="NBT Logo" className="h-14 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-300">Management portal for events, visitors, and analytics.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 pl-10 focus:border-[#B30447] focus:outline-none"
                  placeholder="Enter Username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 pl-10 focus:border-[#B30447] focus:outline-none"
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
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B30447] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#9a033c] disabled:opacity-50"
            >
              <Shield className="h-5 w-5" />
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

