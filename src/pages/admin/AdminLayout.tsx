import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, CalendarRange, ScanLine, Ticket, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { apiService } from '../../services/api';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/events', label: 'Events', icon: CalendarRange },
  { to: '/admin/visitors', label: 'Visitors', icon: Users },
  { to: '/admin/volunteers', label: 'Volunteers', icon: UserPlus },
  { to: '/admin/entries', label: 'Entries', icon: ScanLine },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
] as const;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt');
    if (!token) navigate('/admin/login', { replace: true });
  }, [navigate]);

  const logout = () => {
    apiService.logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white',
            ].join(' ')
          }
        >
          <l.icon className="h-4 w-4" />
          {l.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-slate-950 text-slate-50 sm:flex">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <img src="/NBTlogo.png" alt="NBT" className="h-10 w-auto" />
          {/* <div className="min-w-0">
            <p className="font-display text-sm font-bold">NBT Admin</p>
            <p className="text-xs text-slate-400">Digital Ticketing</p>
          </div> */}
        </div>
        <NavItems />
        <div className="border-t border-slate-800 px-3 py-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <img src="/NBTlogo.png" alt="NBT" className="h-8 w-auto" />
            <p className="font-display text-sm font-bold text-gray-900">NBT Admin</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-slate-950 text-slate-50 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                <div className="flex items-center gap-3">
                  <img src="/NBTlogo.png" alt="NBT" className="h-9 w-auto" />
                  <div>
                    <p className="font-display text-sm font-bold">NBT Admin</p>
                    <p className="text-xs text-slate-400">Digital Ticketing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-slate-800 p-2 text-slate-200"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <NavItems onNavigate={() => setMobileOpen(false)} />

              <div className="border-t border-slate-800 px-3 py-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

