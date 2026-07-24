import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

export default function AnalyzeRoute() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
