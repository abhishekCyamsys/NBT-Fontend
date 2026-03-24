import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiService, VisitorEvent } from '../../services/api';

type AgeRange = '18-24' | '24-30' | '30-35' | '35-50' | '50+';

export default function VolunteerOnSpotRegistration() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    city: '',
    gender: 'M',
    ageRange: '18-24' as AgeRange,
    eventId: localStorage.getItem('scan_event_id') || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('volunteer_jwt');
    if (!token) {
      navigate('/volunteer/login', { replace: true });
      return;
    }
    apiService.getVolunteerEvents()
      .then((data: VisitorEvent[]) => {
         setEvents(data);
         if (data.length > 0 && !form.eventId) {
           const eid = data[0].id || data[0].eventId;
           setForm(p => ({ ...p, eventId: eid }));
           localStorage.setItem('scan_event_id', eid);
         }
      })
      .catch((err: any) => console.error("Failed to fetch events", err));
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await apiService.volunteerRegister({
        name: form.fullName.trim(),
        mobileNumber: form.mobileNumber,
        age: form.ageRange,
        gender: form.gender.toLowerCase() as "m" | "f" | "o",
        city: form.city.trim() || undefined,
        email: form.email.trim() || undefined,
        otpVerified: false
      }, form.eventId.trim());
      setMessage('Registration successful.');
      setForm((p) => ({ ...p, fullName: '', mobileNumber: '', email: '', city: '', ageRange: '18-24' }));
    } catch (err: any) {
      setMessage(err?.message || 'Registration failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-white px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/volunteer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B30447] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-gray-900">On-Spot Registration</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#B30447] focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                <select
                  value={form.eventId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, eventId: e.target.value }));
                    localStorage.setItem('scan_event_id', e.target.value);
                  }}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#B30447] focus:outline-none bg-white truncate"
                  required
                >
                  <option value="">Select an Event</option>
                  {events.map((ev) => (
                    <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>{ev.slug || ev.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  value={form.mobileNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    }))
                  }
                  inputMode="numeric"
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#B30447] focus:outline-none"
                  placeholder="9876543210"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-3 focus:border-[#B30447] focus:outline-none"
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <select
                  value={form.ageRange}
                  onChange={(e) => setForm((p) => ({ ...p, ageRange: e.target.value as AgeRange }))}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-3 focus:border-[#B30447] focus:outline-none"
                  required
                >
                  <option value="18-24">18-24</option>
                  <option value="24-30">24-30</option>
                  <option value="30-35">30-35</option>
                  <option value="35-50">35-50</option>
                  <option value="50+">50+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#B30447] focus:outline-none"
                  placeholder="Your City"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-3 focus:border-[#B30447] focus:outline-none"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !form.fullName.trim() || !form.eventId}
              className="w-full rounded-lg bg-[#B30447] px-4 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#9a033c] disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Quick Register'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 rounded-lg border p-3 ${message.includes('success') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <p className="text-sm font-semibold">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

