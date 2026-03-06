
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from './components/layout/MobileLayout';
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { FamilyView } from './views/FamilyView';
import { ProfileView } from './views/ProfileView';
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { LockerView } from './views/LockerView';
import { AdminView } from './views/AdminView';
import { PaymentView } from './views/PaymentView';
import { NotificationsView } from './views/NotificationsView';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/Toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'employee') return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
    <ToastProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginView />} />

        {/* Employee Dashboard (fullscreen, no BottomNav) */}
        <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />

        {/* Member App */}
        <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomeView />} />
          <Route path="/reservations" element={<CatalogView />} />
          <Route path="/lockers" element={<LockerView />} />
          <Route path="/family" element={<FamilyView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/payment" element={<PaymentView />} />
          <Route path="/notifications" element={<NotificationsView />} />
        </Route>

        {/* Admin Route - requires staff employee login */}
        <Route path="/admin" element={<StaffRoute><AdminView /></StaffRoute>} />
      </Routes>
    </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
