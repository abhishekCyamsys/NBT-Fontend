import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CalendarDays, User } from 'lucide-react';
import { apiService, type EventSession } from '../../services/api';
import Loader from '../../components/Loader';

export default function VisitorSchedule() {
  const { slug } = useParams();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    
    // Load Event Basic Info for Banner/Title
    apiService.getPublicEventBySlug(slug)
      .then((data) => setEventData(data))
      .catch(console.error);

    // Load Sessions
    apiService.getPublicSessions(slug)
      .then((data) => {
        setSessions(data);
        if (data.length > 0) {
          // Initialize selectedDate with the earliest date available in sessions
          const dates = Array.from(new Set(data.map(s => s.sessionDate))).sort();
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          }
        }
      })
      .catch((err) => {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Failed to load schedule';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Derived Data
  const availableDates = useMemo(() => {
    return Array.from(new Set(sessions.map(s => s.sessionDate))).sort();
  }, [sessions]);

  const availableCategories = useMemo(() => {
    if (!selectedDate) return ['All'];
    const filteredByDate = sessions.filter(s => s.sessionDate === selectedDate);
    const cats = Array.from(new Set(filteredByDate.map(s => s.category))).sort();
    return ['All', ...cats];
  }, [sessions, selectedDate]);

  // If a category was selected that isn't available on the new date, reset it to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [availableCategories, selectedCategory]);

  const displayedSessions = useMemo(() => {
    let filtered = sessions.filter(s => s.sessionDate === selectedDate);
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    // They should already be sorted by startTime from backend, but let's be safe
    return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [sessions, selectedDate, selectedCategory]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPillDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleDateString([], { month: 'short' });
    const weekday = d.toLocaleDateString([], { weekday: 'short' });
    return { day, month, weekday };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center">
        <Loader size="lg" />
        <p className="text-gray-500 font-medium animate-pulse mt-4">Loading schedule...</p>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-10 text-center shadow-xl">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Schedule Not Available</h2>
          <p className="text-red-700 font-medium mb-8 leading-relaxed">{error}</p>
          <Link to={`/visitor/events/${slug}`} className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-red-100 px-8 py-3 text-sm font-black text-red-700 hover:bg-red-100 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Simple Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to={`/visitor/events/${slug}`} className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors mb-1">
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
            <h1 className="text-xl font-black text-gray-900">
              Schedule <span className="text-gray-400 font-medium hidden sm:inline">| {eventData?.eventName || 'Event'}</span>
            </h1>
          </div>
          <CalendarDays className="h-6 w-6 text-primary opacity-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        
        {sessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border shadow-sm">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No schedule announced yet.</h3>
            <p className="text-gray-500">Please check back later for the detailed event schedule.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Date Selection Pills */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Select Date</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {availableDates.map(date => {
                  const { day, month, weekday } = formatPillDate(date);
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all border-2 ${
                        isSelected 
                        ? 'bg-primary border-primary text-white shadow-md scale-[1.02]' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{month}</span>
                      <span className="text-2xl font-black leading-none my-1">{day}</span>
                      <span className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{weekday}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Tabs */}
            {availableCategories.length > 1 && (
              <div className="bg-white rounded-xl p-1.5 shadow-sm inline-flex flex-wrap gap-1 border">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                      selectedCategory === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Sessions List */}
            <div className="space-y-4">
              {displayedSessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed">
                  <p className="text-gray-500 font-medium">No sessions scheduled for this selection.</p>
                </div>
              ) : (
                displayedSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {session.category}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                            <Clock className="h-3 w-3" />
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-black text-gray-900 mb-2 pr-4">{session.title}</h3>
                        
                        {session.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {session.description}
                          </p>
                        )}
                      </div>

                      {/* Right column details */}
                      <div className="sm:text-right shrink-0 min-w-[180px] flex flex-col gap-3 sm:items-end p-4 bg-gray-50 rounded-2xl">
                        {session.venue && (
                          <div className="flex items-start sm:justify-end gap-2 text-sm text-gray-700 font-medium">
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                            <span>{session.venue}</span>
                          </div>
                        )}
                        {session.speaker && (
                          <div className="flex items-start sm:justify-end gap-2 text-sm text-gray-700 font-medium">
                            <User className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                            <span>{session.speaker}</span>
                          </div>
                        )}
                        {session.organizer && (
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">
                            By {session.organizer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
