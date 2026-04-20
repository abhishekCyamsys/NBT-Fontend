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
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage your personal details.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-gradient-to-r from-[#334383] to-[#7a0230] px-6 py-10 sm:px-12 text-white flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
          <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm transition-transform hover:scale-105">
            <span className="text-4xl sm:text-5xl font-bold font-display uppercase">{name.charAt(0)}</span>
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-3xl sm:text-4xl font-display font-bold capitalize truncate">{name}</h2>
            <p className="text-blue-100 font-medium tracking-wide mt-2 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-lg">
              <Phone className="h-5 w-5 shrink-0" /> {mobile}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-12">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 pb-3 border-b border-gray-100 flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-12">
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><User className="h-4 w-4" /></div>
                Full Name
              </label>
              <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{name}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><Phone className="h-4 w-4" /></div>
                Mobile Number
              </label>
              <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{mobile}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><Calendar className="h-4 w-4" /></div>
                Age Range
              </label>
              <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{age}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><User className="h-4 w-4" /></div>
                Gender
              </label>
              <p className="text-lg font-semibold text-gray-900 pl-9 capitalize break-words">{getGenderLabel(gender)}</p>
            </div>

            {city !== "Not Provided" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><MapPin className="h-4 w-4" /></div>
                  City
                </label>
                <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{city}</p>
              </div>
            )}

            {email !== "Not Provided" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-[#334383]"><Mail className="h-4 w-4" /></div>
                 Email Address
                </label>
                <p className="text-lg font-semibold text-gray-900 pl-9 break-all">{email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

