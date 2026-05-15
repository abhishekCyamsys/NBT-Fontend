import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowLeft, Ticket, Info, Clock, Share2, Heart, CalendarDays } from 'lucide-react';
import { apiService } from '../../services/api';
const bookImg = '/book_lib.jpg';

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
        age: localStorage.getItem("visitor_age") || "18-24",
        gender: (localStorage.getItem("visitor_gender") || "m") as any,
        email: localStorage.getItem("visitor_email") || undefined,
        city: localStorage.getItem("visitor_city") || undefined,
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
        setError(e.message || "Failed to book ticket");
      }
    } finally {
      if (!window.location.pathname.includes('/tickets')) {
        setCreatingTicket(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Loading event details...</p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-10 text-center shadow-xl">
          <div className="bg-white p-4 rounded-full w-fit mx-auto mb-6 shadow-sm">
            <Info className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-700 font-medium mb-8 leading-relaxed">{error || 'The event you are looking for does not exist or has been removed.'}</p>
          <Link
            to="/visitor/events"
            className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-red-100 px-8 py-3 text-sm font-black text-red-700 hover:bg-red-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isEventClosed = new Date() > new Date(eventData.endDate);

  return (
    <div className="pb-20">
      {/* Full-width Hero Section */}
      <div className="relative h-[40vh] sm:h-[60vh] w-full overflow-hidden">
        <img
          src={eventData.bannerUrl || bookImg}
          alt={eventData.eventName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/visitor/events"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors mb-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>
            <h1 className="font-display text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl">
              {eventData.eventName}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 sm:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Where</p>
                  <p className="text-base font-bold text-gray-900 leading-tight">
                    {eventData.venue ? `${eventData.venue}, ` : ''}{eventData.location}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">When</p>
                  <p className="text-base font-bold text-gray-900 leading-tight">
                    {new Date(eventData.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                    <span className="mx-1.5 opacity-30">—</span>
                    {new Date(eventData.endDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100">
              <div className="space-y-10">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1.5 bg-primary rounded-full" />
                    <h3 className="text-2xl font-black text-gray-900">About the Event</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                    {eventData.description || "Join us for an amazing event celebrating literature and culture. This event brings together authors, readers, and industry professionals for a series of workshops, book signings, and literary discussions."}
                  </p>
                </section>

                {eventData.agenda && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-1.5 bg-primary rounded-full" />
                      <h3 className="text-2xl font-black text-gray-900">The Agenda</h3>
                    </div>
                    <div className="rounded-3xl bg-gray-50 p-8 border border-gray-100">
                      <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap italic">
                        {eventData.agenda}
                      </p>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 sticky top-8">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  Live Registration
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <Share2 className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <Heart className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">9:00 AM – 8:00 PM</p>
                    <p className="text-xs text-gray-500 font-medium">Daily event timings</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Digital Entry Pass</p>
                    <p className="text-xs text-gray-500 font-medium">Fast QR-based entry at gates</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateTicket}
                disabled={creatingTicket || isEventClosed}
                className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg font-black text-white shadow-2xl shadow-rose-200 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {creatingTicket ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Ticket className="h-6 w-6" />
                )}
                {creatingTicket ? 'Securing Pass...' : isEventClosed ? 'Event Ended' : 'Get Free Entry Pass'}
              </button>

              <button
                onClick={() => navigate(`/visitor/events/${slug}/schedule`)}
                className="w-full mt-4 inline-flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-gray-200 px-8 py-4 text-lg font-black text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <CalendarDays className="h-6 w-6" />
                View Event Schedule
              </button>

              <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                No credit card required. Purely digital registration.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-xl">
              <h4 className="text-xl font-black mb-4">Event Policy</h4>
              <ul className="space-y-4">
                {[
                  "Valid digital QR pass required for entry",
                  "One pass per adult visitor",
                  "Child passes (under 18) can be added to parent",
                  "Re-entry permitted with same QR pass"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
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
