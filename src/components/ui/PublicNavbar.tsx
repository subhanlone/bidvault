import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';
import { useRegisterLink, useSignInLink } from '../../hooks/useSignInLink';

interface NavLink {
  label: string;
  to: string;
  /** Highlighted while the current path is one of these. */
  activeOn?: string[];
}

const links: NavLink[] = [
  { label: 'Browse', to: '/browse', activeOn: ['/browse', '/auctions'] },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Sell', to: '/become-a-seller' },
];

const linkClass = (active: boolean) =>
  `text-sm font-medium transition-colors duration-150 pb-px no-underline ${
    active ? 'text-white border-b-2 border-primary' : 'text-white/70 hover:text-white border-b-2 border-transparent'
  }`;

const signInClass =
  'text-sm font-semibold text-white border border-white/40 hover:border-white rounded-lg px-3 py-1.5 transition-colors no-underline';
const registerClass =
  'text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg px-3 py-1.5 transition-colors no-underline';

/**
 * The header for someone who is not signed in. Browse is open to everyone; Sign in and Register
 * remember the page they were pressed on, so signing in brings the person back to it.
 *
 * `minimal` is the header while a returning visitor's session is still being restored: just the
 * logo, so a signed-in person is not shown "Sign in" for a moment.
 */
export default function PublicNavbar({ minimal = false }: { minimal?: boolean }) {
  const { pathname } = useLocation();
  const signIn = useSignInLink();
  const register = useRegisterLink();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  if (minimal) {
    return (
      <nav aria-label="Main navigation" className="sticky top-0 z-20 h-14 bg-navy flex items-center px-6">
        <BidVaultLogo size="sm" to="/" />
      </nav>
    );
  }

  const isActive = (link: NavLink) => (link.activeOn ?? []).some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-20 h-14 bg-navy flex items-center px-6 gap-8 relative">
      <BidVaultLogo size="sm" to="/" />
      <ul className="hidden md:flex items-center gap-6 flex-1 list-none m-0 p-0">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className={linkClass(isActive(link))}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <Link {...signIn} className={signInClass}>Sign in</Link>
        <Link {...register} className={registerClass}>Register</Link>
      </div>
      <button
        className="md:hidden p-2 rounded-sm text-white/80 hover:text-white hover:bg-navy-mid transition-colors ml-auto"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-20 bg-navy border-t border-white/10 animate-slide-down">
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col py-2 list-none m-0 p-0">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive(link) ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 px-6 py-3 flex items-center gap-3">
              <Link {...signIn} onClick={() => setMobileOpen(false)} className={signInClass}>Sign in</Link>
              <Link {...register} onClick={() => setMobileOpen(false)} className={registerClass}>Register</Link>
            </div>
          </nav>
        </div>
      )}
    </nav>
  );
}
