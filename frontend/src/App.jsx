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
import StatsPage from './pages/StatsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
  
};

const PublicRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return !token ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          


          {/* Rutas privadas con layout */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="create-report" element={<CreateReportPage />} />
            <Route path="reports/:id" element={<ReportDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>

          {/* Redirigir rutas desconocidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;