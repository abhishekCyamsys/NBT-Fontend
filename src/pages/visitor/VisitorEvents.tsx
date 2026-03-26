import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { apiService, type VisitorEvent } from '../../services/api';
import bookImg from '../../../public/book_lib.jpg'

export default function VisitorEvents() {
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeringEvent, setRegisteringEvent] = useState<string | null>(null);
  const navigate = useNavigate();

  const hasVisitorJwt = !!localStorage.getItem('visitor_jwt');

  useEffect(() => {
    if (!hasVisitorJwt) return;
    apiService.getVisitorEvents()
      .then(setEvents)
      .catch((err) => {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Failed to load events';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [hasVisitorJwt]);

  const handleCreateTicket = async (event: VisitorEvent) => {
    try {
      setRegisteringEvent(event.id || event.eventId);
      setError('');
      // Single-click ticket creation
      const res = await apiService.registerVisitor({
        name: localStorage.getItem("visitor_name") || "Visitor", 
        mobileNumber: localStorage.getItem("visitor_mobile") || "",
        age: localStorage.getItem("visitor_age") || "18-24",
        gender: (localStorage.getItem("visitor_gender") || "m") as any,
        email: localStorage.getItem("visitor_email") || undefined,
        city: localStorage.getItem("visitor_city") || undefined,
        otpVerified: true
      }, event.slug || event.id || event.eventId);
      localStorage.setItem("visitor_last_registration_id", res.registrationId);
      navigate('/visitor/tickets', { 
        state: { 
          message: "Registration successful! Your pass is securely generating and will be available here shortly." 
        } 
      });
    } catch (e: any) {
      if (e?.message?.includes('already registered') || e?.status === 409 || e?.status === 202) {
         navigate('/visitor/tickets', { 
           state: { 
             message: "You are already registered for this event." 
           } 
         });
      } else {
        setError(e.message || "Failed to book ticket");
      }
    } finally {
      if (!window.location.pathname.includes('/tickets')) {
        setRegisteringEvent(null);
      }
    }
  };

  if (!hasVisitorJwt) {
    return (
      <div className="p-4 rounded-xl bg-red-50 text-red-600">Please login first.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-600">Browse upcoming events and manage your tickets.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B30447]" />
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No events currently available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.id || e.eventId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              {e.bannerUrl ? (
                <img src={e.bannerUrl} alt={e.name} className="h-40 w-full object-cover" />
              ) : (
                <img src={bookImg} alt={e.name} className="h-40 w-full object-cover" />
                // <div className="h-40 w-full bg-gradient-to-br from-[#B30447] to-[#7a0230] opacity-90 mix-blend-multiply" />
              )}
              <div className="p-5">
                <h3 className="font-display text-xl font-bold text-gray-900">{e.name}</h3>
                
                <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {e.venue ? `${e.venue}, ` : ''}{e.location}</span>
                  <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(e.startDate).toLocaleDateString()} - {new Date(e.endDate).toLocaleDateString()}</span>
                </div>
                
                {e.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{e.description}</p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleCreateTicket(e)}
                    disabled={registeringEvent === (e.id || e.eventId)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#B30447] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-[#9a033c] disabled:opacity-50"
                  >
                    {registeringEvent === (e.id || e.eventId) ? 'Loading...' : 'Book Ticket'}
                  </button>
                  <button onClick={() => navigate(`/visitor/events/${e.slug || e.id || e.eventId}`)} className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

