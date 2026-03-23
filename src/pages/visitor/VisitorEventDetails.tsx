import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, Ticket } from 'lucide-react';
import { apiService } from '../../services/api';
import bookImg from '../../../public/book_lib.jpg'

export default function VisitorEventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiService.getPublicEventBySlug(slug)
      .then((data) => {
         setEventData(data);
         if (searchParams.get('autoCreate') === 'true') {
           handleCreateTicket();
         }
      })
      .catch((err) => {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Failed to load event details';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [slug, searchParams]);

  const handleCreateTicket = async () => {
    try {
      setCreatingTicket(true);
      setError('');
      const res = await apiService.registerVisitor({
        name: localStorage.getItem("visitor_name") || "Visitor", 
        mobileNumber: localStorage.getItem("visitor_mobile") || "",
        age: "20-30",
        otpVerified: true
      }, slug);
      
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
        setError(e.message || "Failed to create ticket");
      }
    } finally {
      if (!window.location.pathname.includes('/tickets')) {
        setCreatingTicket(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#B30447]" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-lg font-medium text-red-700">{error || 'Event not found'}</p>
        <Link to="/visitor/events" className="mt-4 inline-block text-sm font-semibold text-[#B30447] hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/visitor/events" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#B30447] transition">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        {eventData.bannerUrl ? (
          <img src={bookImg} alt={eventData.eventName} className="h-64 sm:h-80 w-full object-cover" />
        ) : (
          <img src={bookImg} alt={eventData.eventName} className="h-64 sm:h-80 w-full object-cover" />
        )}
        
        <div className="p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{eventData.eventName}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-gray-600">
                <span className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-[#B30447]" /> {eventData.venue ? `${eventData.venue}, ` : ''}{eventData.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-5 w-5 text-[#B30447]" /> {new Date(eventData.startDate).toLocaleDateString()} - {new Date(eventData.endDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <button
              onClick={handleCreateTicket}
              disabled={creatingTicket}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#B30447] px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#9a033c] hover:shadow-xl focus:ring-4 focus:ring-rose-100 disabled:opacity-50"
            >
              <Ticket className="h-5 w-5" />
              {creatingTicket ? 'Processing...' : 'Create Ticket'}
            </button>
          </div>

          <hr className="my-8 border-gray-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">About the Event</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {eventData.description || "Join us for an amazing event celebrating literature and culture."}
                </p>
              </div>

              {eventData.agenda && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Agenda</h3>
                  <div className="rounded-xl bg-gray-50 p-5 border border-gray-100">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{eventData.agenda}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
               <div className="rounded-xl bg-rose-50 border border-rose-100 p-5">
                 <h4 className="font-bold text-gray-900 mb-2">Registration Open</h4>
                 <p className="text-sm text-gray-600 mb-4">Secure your spot online and generate a digital QR pass for fast entry.</p>
                 <ul className="text-sm text-gray-700 space-y-2 mb-6">
                   <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#B30447]" /> Quick Mobile Entry</li>
                   <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#B30447]" /> Easily add Child Passes</li>
                   <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#B30447]" /> Skip the queues</li>
                 </ul>
                 <button onClick={handleCreateTicket} disabled={creatingTicket} className="w-full justify-center inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#B30447] shadow-sm hover:bg-rose-50 border border-[#B30447] disabled:opacity-50">
                   {creatingTicket ? 'Processing...' : 'Create Ticket'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
