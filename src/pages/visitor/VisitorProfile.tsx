import { User, Phone, Calendar, Mail, MapPin } from "lucide-react";

export default function VisitorProfile() {
  const name = localStorage.getItem("visitor_name") || "Visitor";
  const mobile = localStorage.getItem("visitor_mobile") || "Not Provided";
  const age = localStorage.getItem("visitor_age") || "Not Provided";
  const gender = localStorage.getItem("visitor_gender")?.toUpperCase() || "Not Provided";
  const city = localStorage.getItem("visitor_city") || "Not Provided";
  const email = localStorage.getItem("visitor_email") || "Not Provided";

  const getGenderLabel = (g: string) => {
    if (g === 'M') return 'Male';
    if (g === 'F') return 'Female';
    if (g === 'O') return 'Other';
    return g;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View your personal details and information.</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-gradient-to-r from-[#B30447] to-[#7a0230] px-6 py-8 sm:px-10 text-white flex flex-col sm:flex-row items-center gap-6">
          <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm transition-transform hover:scale-105">
            <span className="text-3xl sm:text-4xl font-bold font-display uppercase">{name.charAt(0)}</span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-display font-bold capitalize">{name}</h2>
            <p className="text-rose-100 font-medium tracking-wide mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm sm:text-base">
              <Phone className="h-4 w-4" /> {mobile}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">Personal Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                <div className="p-1 rounded bg-rose-50 text-[#B30447]"><User className="h-3 w-3" /></div>
                Full Name
              </label>
              <p className="text-base font-semibold text-gray-900 pl-7">{name}</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                <div className="p-1 rounded bg-rose-50 text-[#B30447]"><Phone className="h-3 w-3" /></div>
                Mobile Number
              </label>
              <p className="text-base font-semibold text-gray-900 pl-7">{mobile}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                <div className="p-1 rounded bg-rose-50 text-[#B30447]"><Calendar className="h-3 w-3" /></div>
                Age Range
              </label>
              <p className="text-base font-semibold text-gray-900 pl-7">{age}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                <div className="p-1 rounded bg-rose-50 text-[#B30447]"><User className="h-3 w-3" /></div>
                Gender
              </label>
              <p className="text-base font-semibold text-gray-900 pl-7 capitalize">{getGenderLabel(gender)}</p>
            </div>

            {city !== "Not Provided" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="p-1 rounded bg-rose-50 text-[#B30447]"><MapPin className="h-3 w-3" /></div>
                  City
                </label>
                <p className="text-base font-semibold text-gray-900 pl-7">{city}</p>
              </div>
            )}

            {email !== "Not Provided" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="p-1 rounded bg-rose-50 text-[#B30447]"><Mail className="h-3 w-3" /></div>
                 Email Address
                </label>
                <p className="text-base font-semibold text-gray-900 pl-7 break-all">{email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

