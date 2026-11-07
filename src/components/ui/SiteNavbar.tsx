import { useAuth } from '../../context/auth';
import BuyerNavbar from './BuyerNavbar';
import PublicNavbar from './PublicNavbar';

/**
 * The header of a page open to everyone: the buyer header when signed in, the guest header for a
 * visitor, and a bare one while a returning visitor's session is restored, so nobody signed in is
 * offered "Sign in" for a moment.
 */
export default function SiteNavbar() {
  const { user, isLoading, logout } = useAuth();
  if (user) return <BuyerNavbar userName={user.name} onLogout={logout} />;
  return <PublicNavbar minimal={isLoading} />;
}
