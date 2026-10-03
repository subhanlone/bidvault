import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, Search, Users as UsersIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import ReasonModal from '../../components/ui/ReasonModal';
import { Button, ErrorState, Input } from '../../components/ui';
import { api } from '../../services/api';
import { flattenPages } from '../../queries/auctions';
import { useAdminUsers } from '../../queries/admin';
import { keys } from '../../queries/keys';
import { useInfiniteScrollTrigger } from '../../hooks/useInfiniteScrollTrigger';
import type { AdminUser } from '../../types/api';

function AnonymizeUserModal({ target, onClose, onDone }: {
  target: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (reason.trim().length < 3) {
      setError('Give a reason of at least 3 characters — it is kept in the audit log.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/admin/users/${target.userId}/anonymize`, { reason: reason.trim() });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not delete this account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bold text-[16px] text-navy mb-4">Delete this account?</h2>
        <p className="text-[13px] text-muted mb-4">
          <span className="font-semibold text-secondary">{target.name}</span> ({target.email}) — name
          and email will be removed and every session revoked. Refused if they have an active
          auction or a pending transaction.
        </p>
        <Input
          label="Reason"
          placeholder="e.g. Requested via privacy@bidvault.com ticket #42"
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
        />
        {error && (
          <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2 mt-3">{error}</p>
        )}
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            loading={submitting}
            className="flex-1 border-error text-error hover:bg-error-bg"
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onSuspend, onDelete, onReinstate, reinstating }: {
  user: AdminUser;
  onSuspend: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
  onReinstate: (u: AdminUser) => void;
  reinstating: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="font-semibold text-[13px] text-secondary truncate">
          {user.name} <span className="font-normal text-muted">· {user.role}</span>
          {user.status === 'SUSPENDED' && (
            <span className="ml-2 font-bold text-[10px] text-error bg-error-bg border border-error-border rounded-full px-2 py-0.5 align-middle">Suspended</span>
          )}
        </p>
        <p className="text-[11px] text-placeholder truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {user.status === 'SUSPENDED' ? (
          <Button variant="outline" size="sm" loading={reinstating} onClick={() => onReinstate(user)}>
            Reinstate
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onSuspend(user)}>
            Suspend
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="border-error text-error hover:bg-error-bg"
          onClick={() => onDelete(user)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  // Debounced for the same reason BuyerBrowseAuctions debounces its server-side search: each
  // keystroke would otherwise start a fresh paginated query.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const [anonymizingUser, setAnonymizingUser] = useState<AdminUser | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [reinstatingUserId, setReinstatingUserId] = useState<string | null>(null);

  const { data, isPending, isError, isFetching, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useAdminUsers(debouncedSearch);
  const users = flattenPages(data);
  const sentinelRef = useInfiniteScrollTrigger(
    () => { void fetchNextPage(); },
    // Not while errored: a failed page leaves hasNextPage true and isFetchingNextPage false, so the
    // observer re-attached to a sentinel that is still on screen and asked again at once -- forever.
    hasNextPage === true && !isFetchingNextPage && !isError,
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.admin.users(debouncedSearch) });

  const handleReinstate = async (target: AdminUser) => {
    setReinstatingUserId(target.userId);
    try {
      await api.post(`/admin/users/${target.userId}/reinstate`);
      showToast({ type: 'success', title: 'Account Reinstated', message: `${target.name} can sign in again.` });
      await refresh();
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Could Not Reinstate', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setReinstatingUserId(null);
    }
  };

  return (
    <AdminLayout active="Users">
      {({ openMobileMenu }) => (
        <>
          <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={openMobileMenu}
                aria-label="Open navigation menu"
              >
                <Menu size={18} className="text-tertiary" />
              </button>
              <div>
                <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">User Management</h1>
                <p className="text-[12px] text-muted">Every registered account — suspend, reinstate, or delete</p>
              </div>
            </div>
            <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          </header>

          <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 max-w-[800px]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder pointer-events-none" />
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              {isPending ? (
                <div className="flex flex-col divide-y divide-bg">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex-1">
                        <div className="h-4 w-40 bg-border-light rounded animate-pulse mb-2" />
                        <div className="h-3 w-56 bg-border-light rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-20 bg-border-light rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : isError && users.length === 0 ? (
                <ErrorState
                  title="Could not load accounts"
                  onRetry={() => { void refetch(); }}
                  retrying={isFetching}
                  className="border-0 rounded-none"
                />
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <UsersIcon size={40} strokeWidth={1.3} className="text-placeholder" />
                  <p className="font-bold text-[14px] text-secondary">No matching accounts</p>
                  <p className="text-[12px] text-muted">Try a different name or email.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-bg">
                  {users.map(u => (
                    <UserRow
                      key={u.userId}
                      user={u}
                      onSuspend={setSuspendingUser}
                      onDelete={setAnonymizingUser}
                      onReinstate={handleReinstate}
                      reinstating={reinstatingUserId === u.userId}
                    />
                  ))}
                </div>
              )}
            </div>

            {hasNextPage && (isError ? (
              <div role="alert" className="flex items-center justify-center gap-3 py-4">
                <p className="text-[12px] text-error">Could not load more accounts.</p>
                <Button variant="outline" size="sm" loading={isFetching} onClick={() => { void fetchNextPage(); }}>Try again</Button>
              </div>
            ) : (
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                <div className="size-5 border-2 border-border-medium border-t-primary rounded-full animate-spin" />
              </div>
            ))}
          </div>

          {anonymizingUser && (
            <AnonymizeUserModal
              target={anonymizingUser}
              onClose={() => setAnonymizingUser(null)}
              onDone={async () => {
                showToast({ type: 'success', title: 'Account Deleted', message: `${anonymizingUser.name}'s account has been deleted.` });
                setAnonymizingUser(null);
                await refresh();
              }}
            />
          )}

          {suspendingUser && (
            <ReasonModal
              title="Suspend Account"
              subject={`${suspendingUser.name} (${suspendingUser.email})`}
              description="This blocks sign-in immediately. It does not touch the account's data and can be reversed with Reinstate at any time."
              submitLabel="Suspend Account"
              fieldLabel="Reason"
              placeholder="e.g. Reported for suspicious bidding activity"
              onSubmit={async (reason) => {
                await api.post(`/admin/users/${suspendingUser.userId}/suspend`, { reason });
                showToast({ type: 'success', title: 'Account Suspended', message: `${suspendingUser.name} can no longer sign in.` });
                setSuspendingUser(null);
                await refresh();
              }}
              onClose={() => setSuspendingUser(null)}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}
