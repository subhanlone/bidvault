import { useLocation } from 'react-router-dom';

/**
 * Where "Sign in" and "Register" send a visitor, and where to bring them back to. The page that
 * asked is kept in router state only (see LoginScreen and `safeReturnPath`), never in the address,
 * so nothing about an item someone was looking at ends up in a URL that gets shared or logged.
 * Spread the result onto a `<Link>`.
 */
function useReturnLink<T extends '/login' | '/register'>(to: T): { to: T; state: { from: string } } {
  const { pathname, search } = useLocation();
  return { to, state: { from: pathname + search } };
}

export function useSignInLink() {
  return useReturnLink('/login');
}

export function useRegisterLink() {
  return useReturnLink('/register');
}
