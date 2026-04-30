import { useState } from 'react';
import { X, Users, CheckCircle, Ticket } from 'lucide-react';
import { apiService } from '../services/api';

export default function TicketCreationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventSlug 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (regId: string) => void; 
  eventSlug: string;
}) {
  const [children, setChildren] = useState<Array<{ name: string; age: string }>>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('0-10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        name: localStorage.getItem("visitor_name") || "Visitor", 
        mobileNumber: localStorage.getItem("visitor_mobile") || "",
        age: "20-30",
        otpVerified: true
      };
      const res = await apiService.registerVisitor(payload as any, eventSlug);
      
      localStorage.setItem("visitor_last_registration_id", res.registrationId);

      if (children.length > 0) {
        await apiService.registerChildren(res.registrationId, { children });
      }

      setSuccess(true);
      setTimeout(() => onSuccess(res.registrationId), 1500);
    } catch (e: any) {
      if (e?.message?.includes('already registered') || e?.status === 409 || e?.status === 202) {
         setSuccess(true);
         setTimeout(() => onSuccess(""), 1500); 
      } else {
        setError(e.message || "Failed to create ticket");
      }
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 border border-white/20">
        {!success && <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>}
        
        {success ? (
          <div className="py-8 text-center animate-in slide-in-from-bottom-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">Your passes are ready. Redirecting you...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#7a0230] text-white shadow-xl shadow-rose-200">
                <Ticket className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Get Your Entry Pass</h2>
              <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">Skip the lines at the venue! Would you like to add any child passes right now?</p>
            </div>

            <div className="space-y-4">
              {children.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {children.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm shadow-sm transition">
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 rounded-full border border-gray-100">{c.age}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 mt-4">
                <h5 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                   <Users className="w-4 h-4 text-primary"/> Add Child Pass <span className="text-xs font-normal text-gray-500">(Optional)</span>
                </h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-3">
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Child's Name"
                      className="col-span-3 w-full rounded-xl border-2 border-transparent bg-white shadow-sm px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition"
                    />
                    <select
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="col-span-2 w-full rounded-xl border-2 border-transparent bg-white shadow-sm px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition"
                    >
                      <option value="0-10">0-10 Yrs</option>
                      <option value="10-18">10-18 Yrs</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (childName.trim()) {
                        setChildren([...children, { name: childName.trim(), age: childAge }]);
                        setChildName('');
                        setChildAge('0-10');
                      }
                    }}
                    className="w-full justify-center inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary border border-primary shadow-sm hover:bg-blue-50 transition"
                  >
                    Add This Child
                  </button>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 text-sm font-semibold text-red-600 rounded-xl text-center">{error}</div>}

              <div className="pt-4 flex flex-col gap-2">
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[#8a0236] px-4 py-4 text-base font-bold text-white shadow-xl shadow-rose-200 hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    ) : children.length > 0 ? (
                      `Generate ${children.length + 1} Passes Now`
                    ) : (
                      'Generate My Pass Now'
                    )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
