import LatpeedClaim from './LatpeedClaim';
import { AuthProvider } from '../contexts/AuthContext';

export default function LatpeedClaimRoute() {
  return (
    <AuthProvider>
      <LatpeedClaim />
    </AuthProvider>
  );
}
