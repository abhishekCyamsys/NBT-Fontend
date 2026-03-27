import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, Ticket, LogOut, User } from 'lucide-react';

const tabs = [
  { to: '/visitor/events', label: 'Events', icon: CalendarDays },
  { to: '/visitor/tickets', label: 'My Tickets', icon: Ticket },
  { to: '/visitor/profile', label: 'Profile', icon: User },
] as const;

export default function VisitorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const jwt = localStorage.getItem('visitor_jwt');
    if (!jwt) navigate('/visitor/login', { replace: true });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('visitor_jwt');
    localStorage.removeItem('visitor_name');
    localStorage.removeItem('visitor_mobile');
    localStorage.removeItem('visitor_age');
    localStorage.removeItem('visitor_gender');
    localStorage.removeItem('visitor_city');
    localStorage.removeItem('visitor_email');
    localStorage.removeItem('visitor_last_registration_id');
    localStorage.removeItem('visitor_current_event_id');
    localStorage.removeItem('visitor_jwt');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/NBTlogo.png" alt="NBT" className="h-9 w-auto bg-[#B30447] p-1 rounded-md" />
            <div className="min-w-0">
              <span className="font-display text-lg font-bold text-gray-900 hidden sm:inline">
                Dashboard
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <nav className="border-b bg-white">
        <div className="mx-auto w-full max-w-6xl px-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-[#B30447] text-white'
                      : 'text-gray-700 hover:bg-rose-50 hover:text-[#B30447]',
                  ].join(' ')
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

