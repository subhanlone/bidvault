import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { writeMode, type Mode } from '../../utils/account';

interface ModeSwitchProps {
  /** The side of the app the navbar belongs to. */
  side: Mode;
  /** Called after a navigation, so the mobile menu can close. */
  onNavigate?: () => void;
  className?: string;
}

/**
 * One account buys and sells, so the two navbars each carry the way across to the other side:
 * a seller sees "Switch to buying" / "Switch to selling", anyone else sees "Sell", which leads to
 * Become a seller. It also records which side the person is on, so the next sign-in opens there.
 * Not shown to an admin, who has neither side.
 */
export default function ModeSwitch({ side, onNavigate, className = '' }: ModeSwitchProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isSeller) writeMode(user, side);
  }, [user, side]);

  if (!user || user.role === 'ADMIN') return null;

  let to: string;
  let label: string;
  // The side this link leads to, recorded at the click: the other side's navbar only mounts once its
  // screen has loaded, and a person who reloads in between must still start where they chose.
  let target: Mode | null = null;
  if (!user.isSeller) {
    to = '/become-a-seller';
    label = 'Sell';
  } else if (side === 'buying') {
    to = '/seller/dashboard';
    label = 'Switch to selling';
    target = 'selling';
  } else {
    to = '/buyer/browse';
    label = 'Switch to buying';
    target = 'buying';
  }

  return (
    <Link
      to={to}
      onClick={() => {
        if (target) writeMode(user, target);
        onNavigate?.();
      }}
      className={className}
    >
      {label}
    </Link>
  );
}
