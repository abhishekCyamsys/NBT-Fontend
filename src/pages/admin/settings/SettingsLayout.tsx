import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, Phone, Smartphone, Globe } from 'lucide-react';

const settingsNav = [
  { to: 'whatsapp', label: 'WhatsApp Configuration', icon: MessageSquare },
  { to: 'whatsapp-events', label: 'WhatsApp Event Routing', icon: Phone },
  { to: 'sms', label: 'SMS Configuration', icon: Smartphone },
  { to: 'event-base-url', label: 'Event Base URL', icon: Globe },
] as const;

export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 pb-12 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage system configurations and integrations.</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="flex-shrink-0 lg:w-64">
          <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2">
            {settingsNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50',
                  ].join(' ')
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
