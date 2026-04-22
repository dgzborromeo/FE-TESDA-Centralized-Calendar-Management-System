import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDialogProvider } from './components/AppDialogProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import EventForm from './pages/EventForm';
import EventDetails from './pages/EventDetails';
import Invitations from './pages/Invitations';
import Upcoming from './pages/Upcoming';
import Recent from './pages/Recent';
import YearEvents from './pages/YearEvents';
import EventsView from './pages/EventsView';
import DayView from './pages/DayView';
import ListOfActivity from './pages/ListOfActivity';
import UserConfig from './pages/UserConfig';
import About from './pages/About';
import HelpGuide from './pages/HelpGuide';
import FAQ from './pages/FAQ';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SimpleEventForm from './pages/SimpleEventForm';
import LandingPage from './pages/LandingPage';
import MyEvents from './pages/MyEvents';

/* ── Global page transition loader ──────────────────────────────────────── */
function PageTransitionLoader() {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [prev, setPrev] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prev) {
      setShow(true);
      setPrev(location.pathname);
      const t = setTimeout(() => setShow(false), 600);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!show) return null;

  return (
    <div className="layout-page-transition" aria-label="Loading page..." aria-busy="true">
      <div className="layout-transition-loader">
        <svg className="layout-loader-ring" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
          <circle cx="40" cy="40" r="36" stroke="url(#ringGradG)" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="226" strokeDashoffset="160"/>
          <defs>
            <linearGradient id="ringGradG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="50%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#34d399"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="layout-loader-calendar">
          <div className="layout-cal-header">
            <span className="layout-cal-pin" />
            <span className="layout-cal-pin" />
          </div>
          <div className="layout-cal-body">
            <div className="layout-cal-top-bar" />
            <div className="layout-cal-grid">
              {[...Array(9)].map((_, i) => (
                <span key={i} className={`layout-cal-cell layout-cal-cell-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" aria-label="Loading..." aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" aria-label="Loading..." aria-busy="true" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/simple-event-form" element={<SimpleEventForm />} />
      {/* Landing page — no layout wrapper */}
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="calendar/day/:date" element={<DayView />} />
        <Route path="list-of-activity" element={<ListOfActivity />} />
        <Route path="events" element={<EventsView />} />
        <Route path="upcoming" element={<Navigate to="/events" replace />} />
        <Route path="year-events" element={<Navigate to="/events" replace />} />
        <Route path="recent" element={<Navigate to="/events" replace />} />
        <Route path="about" element={<About />} />
        <Route path="help" element={<HelpGuide />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="support" element={<Support />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        {/* Auth-only pages (require login) */}
        <Route path="user-config" element={<ProtectedRoute><UserConfig /></ProtectedRoute>} />
        <Route path="invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="events/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
        <Route path="events/:id/edit" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
        <Route path="events/:id/details" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDialogProvider>
        <PageTransitionLoader />
        <AppRoutes />
      </AppDialogProvider>
    </AuthProvider>
  );
}
