import { useEffect, useState } from "react";
import { User, Phone, Calendar, Mail, MapPin, Edit3, Check, X, Loader2 } from "lucide-react";
import { apiService } from "../../services/api";

export default function VisitorProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVisitorProfile();
      setProfile(data);
      setEditForm({
        name: data.name,
        gender: data.gender,
        age: data.age,
        city: data.city || "",
        email: data.email || "",
      });
      
      // Update localStorage with fresh data
      localStorage.setItem("visitor_name", data.name);
      localStorage.setItem("visitor_gender", data.gender);
      localStorage.setItem("visitor_age", data.age);
      if (data.city) localStorage.setItem("visitor_city", data.city);
      if (data.email) localStorage.setItem("visitor_email", data.email);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateVisitorProfile(editForm);
      setProfile({ ...profile, ...editForm });
      
      // Update localStorage
      localStorage.setItem("visitor_name", editForm.name);
      localStorage.setItem("visitor_gender", editForm.gender);
      localStorage.setItem("visitor_age", editForm.age);
      localStorage.setItem("visitor_city", editForm.city);
      localStorage.setItem("visitor_email", editForm.email);
      
      setEditing(false);
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const getGenderLabel = (g: string) => {
    if (g === 'M') return 'Male';
    if (g === 'F') return 'Female';
    if (g === 'O') return 'Other';
    return g;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-lg font-medium text-red-700">{error}</p>
        <button onClick={loadProfile} className="mt-4 text-primary font-bold hover:underline">Retry</button>
      </div>
    );
  }

  const name = profile?.name || "Visitor";
  const mobile = profile?.mobileNumber || "Not Provided";

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage your personal details.</p>
        </div>
        {!editing ? (
          <button 
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Edit3 className="h-4 w-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-gradient-to-r from-primary to-[#7a0230] px-6 py-10 sm:px-12 text-white flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
          <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm transition-transform hover:scale-105">
            <span className="text-4xl sm:text-5xl font-bold font-display uppercase">{name.charAt(0)}</span>
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            {editing ? (
              <input 
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="text-2xl sm:text-3xl font-display font-bold bg-white/10 border-2 border-white/20 rounded-lg px-3 py-1 focus:outline-none focus:border-white/50 w-full"
              />
            ) : (
              <h2 className="text-3xl sm:text-4xl font-display font-bold capitalize truncate">{name}</h2>
            )}
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
            {/* Full Name handled in header when editing */}
            {!editing && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-primary"><User className="h-4 w-4" /></div>
                  Full Name
                </label>
                <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{name}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-primary"><Phone className="h-4 w-4" /></div>
                Mobile Number
              </label>
              <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{mobile}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-primary"><Calendar className="h-4 w-4" /></div>
                Age Range
              </label>
              {editing ? (
                <select
                  value={editForm.age}
                  onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                  className="ml-9 block w-full rounded-lg border-2 border-gray-100 px-3 py-2 focus:border-primary focus:outline-none text-gray-900"
                >
                  <option value="18-24">18-24</option>
                  <option value="24-30">24-30</option>
                  <option value="30-35">30-35</option>
                  <option value="35-50">35-50</option>
                  <option value="50-100">50+</option>
                </select>
              ) : (
                <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{profile?.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-primary"><User className="h-4 w-4" /></div>
                Gender
              </label>
              {editing ? (
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                  className="ml-9 block w-full rounded-lg border-2 border-gray-100 px-3 py-2 focus:border-primary focus:outline-none text-gray-900"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              ) : (
                <p className="text-lg font-semibold text-gray-900 pl-9 capitalize break-words">{getGenderLabel(profile?.gender)}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-primary"><MapPin className="h-4 w-4" /></div>
                City
              </label>
              {editing ? (
                <input 
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  placeholder="e.g. Dehradun"
                  className="ml-9 block w-full rounded-lg border-2 border-gray-100 px-3 py-2 focus:border-primary focus:outline-none text-gray-900"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 pl-9 break-words">{profile?.city || "Not Provided"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-primary"><Mail className="h-4 w-4" /></div>
               Email Address
              </label>
              {editing ? (
                <input 
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="name@example.com"
                  className="ml-9 block w-full rounded-lg border-2 border-gray-100 px-3 py-2 focus:border-primary focus:outline-none text-gray-900"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 pl-9 break-all">{profile?.email || "Not Provided"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
