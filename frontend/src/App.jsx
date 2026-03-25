import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import { lazy, Suspense } from 'react';
import AppLayout from './components/layout/AppLayout';

const HomePage           = lazy(() => import('./pages/HomePage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const CreateReportPage   = lazy(() => import('./pages/CreateReportPage'));
const ReportDetailPage   = lazy(() => import('./pages/ReportDetailPage'));
const MapPage            = lazy(() => import('./pages/MapPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const StatsPage          = lazy(() => import('./pages/StatsPage'));
const PetitionsPage      = lazy(() => import('./pages/PetitionsPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const EditReportPage     = lazy(() => import('./pages/EditReportPage'));
const PublicProfilePage  = lazy(() => import('./pages/PublicProfilePage'));
const MessagesPage       = lazy(() => import('./pages/MessagesPage'));
const AdminMessagesPage  = lazy(() => import('./pages/AdminMessagesPage'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  </div>
);
import { OfflineBanner } from './components/ui/ErrorScreen';
import { AnimatePresence } from 'framer-motion';
import useTheme from './hooks/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      networkMode: 'offlineFirst',
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
  useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />

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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;