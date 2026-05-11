import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Info, Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { apiService, type VisitorEvent } from '../../services/api';
const bookImg = '/book_lib.jpg';

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

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: CalendarDays };
    if (now > end) return { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle2 };
    return { label: 'Ongoing', color: 'bg-green-100 text-green-700', icon: Clock };
  };

  if (!hasVisitorJwt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <Info className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Authentication Required</h2>
        <p className="text-gray-600 mt-2">Please login first to view and book events.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">Featured Events</h1>
          <p className="text-gray-500 font-medium">Discover the best literary festivals and book fairs near you.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {events.length} Events Available
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 animate-in fade-in duration-300">
          <Info className="h-5 w-5 text-red-500" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-[450px] w-full animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 py-20 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-500">No events found at the moment.</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for upcoming festivals!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {events.map((e) => {
            const status = getEventStatus(e.startDate, e.endDate);
            const StatusIcon = status.icon;
            
            return (
              <div key={e.id || e.eventId} className="group relative overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="relative h-64 w-full overflow-hidden">
                  <img 
                    src={e.bannerUrl || bookImg} 
                    alt={e.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  
                  <div className={`absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-4">
                    <h3 className="font-display text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{e.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</p>
                        <p className="text-sm font-bold truncate">{e.venue || e.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date Range</p>
                        <p className="text-sm font-bold truncate">
                          {new Date(e.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(e.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {e.description && (
                    <p className="mb-8 text-sm text-gray-500 leading-relaxed line-clamp-2 italic">
                      "{e.description}"
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleCreateTicket(e)}
                      disabled={registeringEvent === (e.id || e.eventId) || status.label === 'Completed'}
                      className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-white shadow-xl shadow-rose-100 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {registeringEvent === (e.id || e.eventId) ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                        </span>
                      ) : status.label === 'Completed' ? 'Closed' : 'Book Free Ticket'}
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/visitor/events/${e.slug || e.id || e.eventId}`)} 
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-white px-4 py-4 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-200"
                    >
                      Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
