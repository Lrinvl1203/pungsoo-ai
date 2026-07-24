import AdminDashboard from './AdminDashboard';
import { AuthProvider } from '../contexts/AuthContext';

export default function AdminRoute() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}
