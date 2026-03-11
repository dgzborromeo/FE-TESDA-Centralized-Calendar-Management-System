import { Routes, Route, Navigate } from 'react-router-dom';
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
import DayView from './pages/DayView';
import ListOfActivity from './pages/ListOfActivity';
import UserConfig from './pages/UserConfig';
import About from './pages/About';
import HelpGuide from './pages/HelpGuide';
import FAQ from './pages/FAQ';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/" element={<Layout />}>
        {/* Public landing: show dashboard even without login */}
        <Route index element={<Dashboard />} />
        {/* Public view-only pages */}
        <Route path="dashboard" element={<Dashboard />} />
    
        <Route path="calendar" element={<Calendar />} />
        
        <Route path="calendar/day/:date" element={<DayView />} />
        <Route path="list-of-activity" element={<ListOfActivity />} />
        <Route path="upcoming" element={<Upcoming />} />
        <Route path="year-events" element={<YearEvents />} />
        <Route path="recent" element={<Recent />} />
        <Route path="about" element={<About />} />
        <Route path="help" element={<HelpGuide />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="support" element={<Support />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        {/* Auth-only pages (require login) */}
        <Route path="user-config" element={<ProtectedRoute><UserConfig /></ProtectedRoute>} />
        <Route path="invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
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
        <AppRoutes />
      </AppDialogProvider>
    </AuthProvider>
  );
}
