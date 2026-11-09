import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import type { UserRole } from '../types/api';
import { homePath } from '../utils/account';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /**
   * B5: also let in someone whose selling an admin paused. Only for My Items: they still owe the
   * buyers of the sales they made (shipping, disputes), and the server allows those by ownership.
   */
  allowPausedSeller?: boolean;
}

/**
 * Who may open a screen. `BUYER` is any signed-in non-admin account, `SELLER` an account with
 * `user.isSeller` (from the server), `ADMIN` an admin. The token's role claim is not consulted, so
 * becoming a seller changes what opens on the next page load.
 */
export default function ProtectedRoute({ children, allowedRoles, allowPausedSeller = false }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-muted font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  // Sign-in sends the person back here afterwards (see LoginScreen).
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  const isAdmin = user.role === 'ADMIN';
  const allowed = isAdmin
    ? allowedRoles.includes('ADMIN')
    : allowedRoles.includes('BUYER') ||
      (allowedRoles.includes('SELLER') && (user.isSeller || (allowPausedSeller && Boolean(user.sellerRevokedAt))));
  if (allowed) return <>{children}</>;

  // A buyer at a seller-only screen is asked to become a seller rather than bounced to their home.
  if (!isAdmin && allowedRoles.includes('SELLER') && !user.isSeller) {
    return <Navigate to="/become-a-seller" replace />;
  }
  return <Navigate to={homePath(user)} replace />;
}
