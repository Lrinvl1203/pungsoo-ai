import MyPage from './MyPage';
import { AuthProvider } from '../contexts/AuthContext';

export default function MyPageRoute() {
  return (
    <AuthProvider>
      <MyPage />
    </AuthProvider>
  );
}
