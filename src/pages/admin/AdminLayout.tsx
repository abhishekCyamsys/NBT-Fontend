import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, CalendarRange, ScanLine, Ticket, LogOut, Menu, X, ChevronDown, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { apiService } from '../../services/api';
import { EventProvider, useEventContext } from '../../context/EventContext';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/events', label: 'Events', icon: CalendarRange },
  { to: '/admin/visitors', label: 'Visitors', icon: Users },
  { to: '/admin/volunteers', label: 'Volunteers', icon: UserPlus },
  { to: '/admin/entries', label: 'Entries', icon: ScanLine },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt');
    if (!token) navigate('/admin/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const logout = () => {
    apiService.logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <EventProvider>
      <AdminLayoutContent 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        logout={logout} 
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />
    </EventProvider>
  );
}

function AdminLayoutContent({
  mobileOpen,
  setMobileOpen,
  logout,
  isCollapsed,
  toggleSidebar,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  logout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}) {
  const { events, activeEventId, setActiveEventId, isLoadingEvents } = useEventContext();

  const NavItems = ({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((l) => (
        <NavLink
            key={l.to}
            to={l.to}
            onClick={onNavigate}
            title={collapsed ? l.label : undefined}
            className={({ isActive }) =>
                [
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                    collapsed ? 'justify-center px-0' : '',
                ].join(' ')
            }
        >
          <l.icon className={collapsed ? "h-5 w-5" : "h-4 w-4"} />
          {!collapsed && <span className="truncate">{l.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  return (
    /* Root: fixed height, no overflow – scrolling happens only inside <main> */
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ── Desktop Sidebar – transition for width ── */}
      <aside 
        className={[
          "hidden sm:flex fixed inset-y-0 left-0 z-20 flex-col bg-[#0f172a] text-slate-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-60"
        ].join(' ')}
      >
        {/* Logo area */}
        <div className={[
            "flex items-center border-b border-slate-800 px-5 py-4 flex-shrink-0 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "gap-3"
        ].join(' ')}>
          <img 
            src="/NBTlogo.png" 
            alt="NBT" 
            className={[
                "transition-all duration-300",
                isCollapsed ? "h-8 w-auto" : "h-12 w-auto"
            ].join(' ')} 
          />
        </div>
        {/* Nav – scrollable if it ever overflows */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <NavItems collapsed={isCollapsed} />
        </div>
      </aside>

      {/* ── Content column (pushed right by sidebar on desktop) ── */}
      <div 
        className={[
            "flex flex-1 flex-col min-h-0 transition-all duration-300 ease-in-out",
            isCollapsed ? "sm:ml-20" : "sm:ml-60"
        ].join(' ')}
      >

        {/* ── Top header ── */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">

          {/* Left: toggle / mobile hamburger / desktop event selector */}
          <div className="flex items-center gap-3">

            {/* Desktop: Sidebar toggle button */}
            <button
                type="button"
                onClick={toggleSidebar}
                className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>

            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 sm:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile: logo */}
            <img src="/NBTlogo.png" alt="NBT" className="h-10 w-auto sm:hidden" />

            {/* Event dropdown */}
            {!isLoadingEvents && events.length > 0 && (
              <div className="relative">
                <select
                  value={activeEventId || ''}
                  onChange={(e) => setActiveEventId(e.target.value)}
                  className="appearance-none cursor-pointer rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100 min-w-[200px] sm:min-w-[220px]"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.eventName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            )}
          </div>

          {/* Right: Logout */}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* ── Scrollable page content ── */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile slide-over drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-[#0f172a] text-slate-50 shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 px-4 py-4">
              <div className="flex items-center gap-3">
                <img src="/NBTlogo.png" alt="NBT" className="h-10 w-auto" />
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

            <div className="flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
