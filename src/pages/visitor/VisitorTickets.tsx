import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService, type TicketsResponse } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function VisitorTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationId = useMemo(
    () => localStorage.getItem('visitor_last_registration_id') ?? '',
    []
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<TicketsResponse | null>(null);

  const [childPasses, setChildPasses] = useState([{ name: '', age: '5-10' }]);
  const [addingChild, setAddingChild] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setToast({ message: location.state.message, type: 'success' });
      window.history.replaceState({}, document.title);
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  useEffect(() => {
    let timeoutId: any;
    let isMounted = true;

    const fetchWithPolling = async () => {
      if (!registrationId) return;
      try {
        const res = await apiService.getTickets(registrationId);
        if (!isMounted) return;
        setData(res);
        if (res.status === 'processing' || res.tickets.length === 0) {
           timeoutId = setTimeout(fetchWithPolling, 3000);
        } else {
           setLoading(false);
        }
      } catch (e: any) {
        if (!isMounted) return;
        const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Failed to load tickets';
        setError(msg);
        setLoading(false);
      }
    };

    if (registrationId) {
       setLoading(true);
       fetchWithPolling();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [registrationId]);

  const triggerPolling = () => {
    const poll = async () => {
      if (!registrationId) return;
      try {
        const res = await apiService.getTickets(registrationId);
        setData(res);
        if (res.status === 'processing' || res.tickets.length === 0) {
          setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      } catch (e) {
        // Handle error silently during polling
      }
    };
    setTimeout(poll, 3000);
  };

  const handleAddChild = async () => {
    const validChildren = childPasses.filter(c => c.name.trim());
    if (validChildren.length === 0) return;
    try {
      setAddingChild(true);
      setError('');
      await apiService.registerChildren(registrationId, {
        children: validChildren.map(c => ({ name: c.name.trim(), age: c.age }))
      });
      setChildPasses([{ name: '', age: '5-10' }]);
      setShowAddChildModal(false);
      showToast("Children added successfully! Their tickets will be available here shortly.", "success");
      setData((prev) => prev ? { ...prev, status: 'processing' } : null);
      triggerPolling();
    } catch (e: any) {
      showToast(e.message || "Failed to add child tickets", "error");
    } finally {
      setAddingChild(false);
    }
  };

  const downloadTicket = async (ticketId: string) => {
    const el = document.getElementById(`ticket-${ticketId}`);
    if (!el) return;
    
    const originalOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    try {
      const canvas = await html2canvas(el, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });

      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `NBT_Pass_${ticketId}.png`;
      a.click();
    } catch (e) {
      console.error("Failed to download ticket", e);
    } finally {
      el.style.overflow = originalOverflow;
    }
  };

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-8 fade-in slide-out-to-bottom-8 duration-300">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{toast.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs text-gray-600">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="mt-1 text-sm text-gray-600">Scan this ticket at entry gates.</p>
        </div>
        {data && data.tickets.length > 0 && data.status !== 'processing' && (
          <button
            onClick={() => setShowAddChildModal(true)}
            className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-200"
          >
            + Add Child Ticket
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {!registrationId ? (
          <>
            <p className="text-sm text-gray-700">No tickets found yet. Browse events or log in to create a ticket!</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/visitor/events" className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Browse events
              </Link>
              <Link to="/visitor/login" className="inline-flex items-center justify-center rounded-lg bg-[#B30447] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#9a033c]">
                Login
              </Link>
            </div>
          </>
        ) : loading && !data ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#B30447]" />
          </div>
        ) : error && !data ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button onClick={() => navigate('/visitor/events')} className="mt-3 text-sm font-bold text-[#B30447] hover:underline">
              ⟵ Back to Events
            </button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 mb-2 animate-in fade-in">
                 <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            {data.tickets.length === 0 || data.status === 'processing' || addingChild ? (
               <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                 <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#B30447] mb-6" />
                 <p className="font-display font-bold text-gray-900 text-2xl">Generating your tickets...</p>
                 <p className="text-gray-500 mt-3 max-w-md mx-auto">Please stay on this page. We are securely creating your entry tickets and they will appear here momentarily.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {data.tickets.map((t) => (
                  <div id={`ticket-${t.ticketId}`} key={t.ticketId} className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 transition hover:shadow-2xl">
                    <div className="absolute -left-4 top-[45%] z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-gray-100 bg-gray-50 shadow-inner"></div>
                    <div className="absolute -right-4 top-[45%] z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-gray-100 bg-gray-50 shadow-inner"></div>
                    
                    <div className="bg-white">
                      <div className="bg-gradient-to-br from-[#B30447] to-[#7a0230] p-6 text-white text-center">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-rose-200 uppercase mb-2">Visitor Entry Ticket</p>
                        <h3 className="font-display font-extrabold text-xl leading-tight line-clamp-2">{data.event?.name || 'NBT Public Event'}</h3>
                      </div>
                      
                      <div className="px-8 pb-8 pt-6 border-b-2 border-dashed border-gray-200">
                        <div className="flex flex-col items-center">
                          <div className="rounded-2xl border-[6px] border-rose-50 p-3 shadow-sm mb-3">
                            <QRCodeSVG value={t.qrToken} size={160} level="H" includeMargin={false} />
                          </div>
                          {t.ticketNumber && <p className="text-[11px] text-gray-400 font-mono tracking-widest">{t.ticketNumber}</p>}
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendee</p>
                            <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${t.ticketType === 'child' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-[#B30447]'}`}>
                              {t.ticketType || 'Parent'}
                            </span>

                          </div> <p className="font-bold text-gray-900 text-xl leading-none capitalize">
                             {t.holderName && t.holderName}
                          </p>
                          
                          {(data.event?.venue || data.event?.location || data.event?.startDate) && (
                            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
                              {(data.event?.venue || data.event?.location) && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Venue & Location</p>
                                  <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                                    {data.event.venue ? `${data.event.venue}, ` : ''}{data.event.location || ''}
                                  </p>
                                </div>
                              )}
                              
                              {data.event?.startDate && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Valid Dates</p>
                                  <p className="text-xs font-bold text-[#B30447] line-clamp-2 leading-tight">
                                    {new Date(data.event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                    {data.event?.endDate ? ` - ${new Date(data.event.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}` : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div data-html2canvas-ignore="true" className="bg-gray-50/80 p-4 text-center">
                      <button onClick={() => downloadTicket(t.ticketId)} className="w-full justify-center text-sm font-bold text-[#B30447] hover:text-[#9a033c] transition inline-flex items-center gap-2">
                         <Download className="w-4 h-4" />
                         Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700">No tickets available.</p>
        )}
      </div>

      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Add Child Ticket</h3>
            <p className="text-sm text-gray-600 mb-5">Provide details for your child's entry ticket. Max 3 passes.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {childPasses.map((child, index) => (
                <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3 pt-4 relative">
                  {childPasses.length > 1 && (
                    <button 
                      onClick={() => setChildPasses(childPasses.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm text-gray-400 hover:text-red-600 border border-gray-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Child {index + 1} Name</label>
                    <input
                      value={child.name}
                      onChange={(e) => {
                        const next = [...childPasses];
                        next[index].name = e.target.value;
                        setChildPasses(next);
                      }}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#B30447] focus:ring-2 focus:ring-rose-100 focus:outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Age Group</label>
                    <select
                      value={child.age}
                      onChange={(e) => {
                        const next = [...childPasses];
                        next[index].age = e.target.value;
                        setChildPasses(next);
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-[#B30447] focus:ring-2 focus:ring-rose-100 focus:outline-none transition-shadow"
                    >
                      <option value="5-10">5-10 Years Old</option>
                      <option value="11-14">11-14 Years Old</option>
                      <option value="14-18">14-18 Years Old</option>
                    </select>
                  </div>
                </div>
              ))}
              
              {childPasses.length < 3 && (
                <button
                  type="button"
                  onClick={() => setChildPasses([...childPasses, { name: '', age: '5-10' }])}
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:border-[#B30447] hover:text-[#B30447] transition-colors"
                >
                  + Add Another Child
                </button>
              )}

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  onClick={() => {
                     setShowAddChildModal(false);
                     setChildPasses([{ name: '', age: '5-10' }]);
                  }}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChild}
                  disabled={addingChild || childPasses.filter(c => c.name.trim()).length === 0}
                  className="flex-1 rounded-xl bg-[#B30447] px-4 py-3 text-sm font-bold text-white hover:bg-[#9a033c] disabled:opacity-50 shadow-lg shadow-rose-200 transition-all"
                >
                  {addingChild ? 'Adding...' : 'Add Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

