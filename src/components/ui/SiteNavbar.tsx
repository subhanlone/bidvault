import { useAuth } from '../../context/auth';
import BuyerNavbar from './BuyerNavbar';
import PublicNavbar from './PublicNavbar';

/**
 * The header of a page that is open to everyone: the buyer header for a signed-in person, the
 * guest header for a visitor. While a returning visitor's session is being restored it shows
 * neither's links, so nobody who is signed in is offered "Sign in" for a moment.
 */
export default function SiteNavbar() {
  const { user, isLoading, logout } = useAuth();
  if (user) return <BuyerNavbar userName={user.name} onLogout={logout} />;
  return <PublicNavbar minimal={isLoading} />;
}
