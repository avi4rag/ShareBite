import { Donate } from './pages/donate';
import './workspace.css';
import { Discovery, DonationDetail } from './pages/discovery';
import { Orders, OrderDetail } from './pages/orders';
import { Leaderboard, CertificatePage } from './pages/leaderboard';
import { DonorDashboard, NgoDashboard } from './pages/dashboard';
import { NgoDirectory, NgoProfile } from './pages/ngos';
import { AdminPanel } from './pages/admin';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { queryClient } from './lib/api';
import { Layout } from './components/layout';
import { Landing } from './pages/landing';
import { EmptyState, Button } from './components/ui';
import { AuthProvider, Protected, useAuth } from './lib/auth';
import { AuthPage } from './pages/auth';
import { Settings } from './pages/settings';

function DashboardSwitch() {
  const { user } = useAuth();
  if (user?.role === 'ngo') return <NgoDashboard />;
  return <DonorDashboard />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="donate" element={<Protected roles={['donor']}><Donate /></Protected>} />
                <Route path="discover" element={<Discovery />} />
                <Route path="listings/:listingId" element={<DonationDetail />} />
                <Route path="login" element={<AuthPage />} />
                <Route path="settings" element={<Protected roles={['donor', 'ngo']}><Settings /></Protected>} />
                <Route path="orders" element={<Protected roles={['donor', 'ngo']}><Orders /></Protected>} />
                <Route path="orders/:orderId" element={<Protected roles={['donor', 'ngo', 'admin']}><OrderDetail /></Protected>} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="certificates/:certId" element={<CertificatePage />} />
                <Route path="dashboard" element={<Protected roles={['donor', 'ngo']}><DashboardSwitch /></Protected>} />
                <Route path="ngos" element={<NgoDirectory />} />
                <Route path="ngos/:userId" element={<NgoProfile />} />
                <Route path="admin" element={<Protected roles={['admin']}><AdminPanel /></Protected>} />
                <Route path="*" element={
                  <div className="container section">
                    <EmptyState
                      title="This table has moved"
                      description="Let's get you back to the neighbourhood."
                      action={<Button asChild><Link to="/">Back home</Link></Button>}
                    />
                  </div>
                } />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </MotionConfig>
    </QueryClientProvider>
  );
}
