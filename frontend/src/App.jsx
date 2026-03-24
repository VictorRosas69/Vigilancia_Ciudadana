import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StatsPage from './pages/StatsPage';
import PetitionsPage from './pages/PetitionsPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EditReportPage from './pages/EditReportPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage from './pages/MessagesPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import OnboardingPage from './pages/OnboardingPage';
import { OfflineBanner } from './components/ui/ErrorScreen';
import { AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,       // Mantener caché 1 hora
      networkMode: 'offlineFirst',   // Mostrar datos cacheados sin internet
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
  
};

const PublicRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (token) return <Navigate to="/" replace />;
  if (!localStorage.getItem('onboarding_done')) return <Navigate to="/onboarding" replace />;
  return children;
};

const OnboardingRoute = ({ children }) => {
  const done = localStorage.getItem('onboarding_done');
  return !done ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Banner global sin conexión */}
        <AnimatePresence><OfflineBanner /></AnimatePresence>

        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              maxWidth: '320px',
            },
            success: { duration: 2500 },
            error:   { duration: 3500 },
          }}
        />
        <Routes>
          {/* Onboarding (solo primera vez) */}
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

          {/* Rutas públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          


          {/* Panel web de administración (sin layout móvil) */}
          <Route path="/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />

          {/* Rutas privadas con layout */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="create-report" element={<CreateReportPage />} />
            <Route path="reports/:id" element={<ReportDetailPage />} />
            <Route path="reports/:id/edit" element={<EditReportPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="petitions" element={<PetitionsPage />} />
            <Route path="users/:id" element={<PublicProfilePage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="admin/messages" element={<AdminMessagesPage />} />
          </Route>

          {/* Página 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;