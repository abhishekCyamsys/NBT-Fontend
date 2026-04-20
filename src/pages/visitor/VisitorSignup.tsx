import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';


export default function VisitorSignup() {
  const navigate = useNavigate();
  const mobileNumber =
    localStorage.getItem('visitor_mobile') || localStorage.getItem('guest_mobile') || '';

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'M',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mobileNumber) {
      setError('Missing mobile number. Please login again.');
      return;
    }
    setLoading(true);
    try {
      const eventId = localStorage.getItem('current_event_id') || undefined;
      const res = await apiService.registerVisitor({
        name: form.name.trim(),
        mobileNumber,
        age: form.age,
        gender: form.gender.toUpperCase() as any,
        otpVerified: true,
      }, eventId);

      localStorage.setItem('visitor_last_registration_id', res.registrationId);
      localStorage.setItem('visitor_name', form.name.trim());
      localStorage.setItem('visitor_age', form.age);
      localStorage.setItem('visitor_gender', form.gender.toUpperCase());
      navigate('/visitor/tickets');
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col py-12 px-4 sm:px-6 lg:px-8 items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="rounded-2xl bg-[#334383] p-4 inline-flex shadow-lg transition-transform hover:-translate-y-1">
            <img src="/NBTlogo.png" alt="NBT Logo" className="h-10 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">Register</h2>
          <p className="mt-2 text-sm text-gray-600">Provide a few details to finalize your visitor registration.</p>
        </div>

        <form onSubmit={(e) => void submit(e)} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#334383] focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <select
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#334383] focus:outline-none bg-white"
                >
                  <option value="" disabled>Select Age Range</option>
                  <option value="18-24">18-24</option>
                  <option value="24-30">24-30</option>
                  <option value="30-35">30-35</option>
                  <option value="35-50">35-50</option>
                  <option value="50-100">50+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#334383] focus:outline-none bg-white"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="mt-6 w-full rounded-xl bg-[#334383] px-4 py-3.5 text-base font-bold text-white shadow hover:bg-[#263262] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 transition"
            >
              {loading ? 'Processing...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-700">
            After setup, you can browse events, book tickets, and view QR tickets.
          </p>
        </div>
      </div>
    </div>
  );
}

