import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import VolunteerLogin from './pages/volunteer/VolunteerLogin';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import VolunteerScan from './pages/volunteer/VolunteerScan';
import VolunteerOnSpotRegistration from './pages/volunteer/VolunteerOnSpotRegistration';
import VolunteerHistory from './pages/volunteer/VolunteerHistory';
import VisitorDashboard from './pages/visitor/VisitorDashboard';
import VisitorEvents from './pages/visitor/VisitorEvents';
import VisitorEventDetails from './pages/visitor/VisitorEventDetails';
import VisitorTickets from './pages/visitor/VisitorTickets';
import VisitorProfile from './pages/visitor/VisitorProfile';
import VisitorLogin from './pages/visitor/VisitorLogin';
import VisitorSignup from './pages/visitor/VisitorSignup';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardHome from './pages/admin/DashboardHome';
import AdminVisitorsPage from './pages/admin/VisitorsPage';
import AdminVolunteersPage from './pages/admin/VolunteersPage';
import AdminEventsPage from './pages/admin/EventsPage';
import AdminEntriesPage from './pages/admin/EntriesPage';
import AdminTicketsPage from './pages/admin/TicketsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:eventId" element={<VisitorLogin />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/visitor/login" element={<VisitorLogin />} />
        <Route path="/visitor/login/:eventId" element={<VisitorLogin />} />
        <Route path="/visitor/signup" element={<VisitorSignup />} />
        <Route path="/visitor/register" element={<Navigate to="/visitor/login" replace />} />
        <Route path="/visitor" element={<VisitorDashboard />}>
          <Route path="events" element={<VisitorEvents />} />
          <Route path="events/:slug" element={<VisitorEventDetails />} />
          <Route path="tickets" element={<VisitorTickets />} />
          <Route path="profile" element={<VisitorProfile />} />
          <Route path="" element={<Navigate to="/visitor/events" replace />} />
        </Route>
        <Route path="/volunteer/login" element={<VolunteerLogin />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
        <Route path="/volunteer/scan" element={<VolunteerScan />} />
        <Route path="/volunteer/register" element={<VolunteerOnSpotRegistration />} />
        <Route path="/volunteer/history" element={<VolunteerHistory />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardHome />} />
          <Route path="visitors" element={<AdminVisitorsPage />} />
          <Route path="volunteers" element={<AdminVolunteersPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="entries" element={<AdminEntriesPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
