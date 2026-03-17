
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MobileLayout } from './components/layout/MobileLayout';
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { FamilyView } from './views/FamilyView';
import { ProfileView } from './views/ProfileView';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/Toast';
import { AppProviders } from './components/providers/AppProviders';

// Keep Railway backend alive — ping on load + every 4 min while app is open
const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
fetch(BACKEND_BASE + '/health').catch(() => {});
setInterval(() => fetch(BACKEND_BASE + '/health').catch(() => {}), 4 * 60 * 1000);

// Lazy-loaded views (not on primary nav)
const EmployeeDashboard = lazy(() => import('./views/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const LockerView = lazy(() => import('./views/LockerView').then(m => ({ default: m.LockerView })));
const AdminView = lazy(() => import('./views/AdminView').then(m => ({ default: m.AdminView })));
const PaymentView = lazy(() => import('./views/PaymentView').then(m => ({ default: m.PaymentView })));
const NotificationsView = lazy(() => import('./views/NotificationsView').then(m => ({ default: m.NotificationsView })));
const TournamentView = lazy(() => import('./views/TournamentView').then(m => ({ default: m.TournamentView })));
const GuestPassView = lazy(() => import('./views/GuestPassView').then(m => ({ default: m.GuestPassView })));
const WelcomeView = lazy(() => import('./views/WelcomeView').then(m => ({ default: m.WelcomeView })));

function LazyFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
      <div className="animate-spin" style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-gold)',
      }} />
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};


const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'employee') return <Navigate to="/" replace />;
  if (user?.role !== 'administrador') return <Navigate to="/employee" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
    <AppProviders>
    <ToastProvider>
      <Suspense fallback={<LazyFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginView />} />

        {/* Welcome animation (plays once per session after login) */}
        <Route path="/welcome" element={<ProtectedRoute><WelcomeView /></ProtectedRoute>} />

        {/* App (Member + Employee share MobileLayout with BottomNav) */}
        <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomeView />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/reservations" element={<CatalogView />} />
          <Route path="/lockers" element={<LockerView />} />
          <Route path="/family" element={<FamilyView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/payment" element={<PaymentView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/tournaments" element={<TournamentView />} />
          <Route path="/guests" element={<GuestPassView />} />
        </Route>

        {/* Admin Route - requires administrador role */}
        <Route path="/admin" element={<AdminRoute><AdminView /></AdminRoute>} />
      </Routes>
      </Suspense>
    </ToastProvider>
    </AppProviders>
    </BrowserRouter>
  );
}

export default App;
