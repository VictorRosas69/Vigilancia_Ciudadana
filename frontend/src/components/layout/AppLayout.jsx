import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Toaster } from 'react-hot-toast';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
};

export default AppLayout;