import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import { Button, Input } from '../../components/ui';
import { api } from '../../services/api';
// Support email is stored, so it uses the same strict rule the server enforces on PUT /settings.
import { isStrictEmail } from '../../utils/validation';

const PLATFORM_NAME = 'BidVault';
const MAX_LISTING_PRICE = 100_000_000;
const MAX_BID_INCREMENT = 10_000_000;
const MAX_REVIEW_TIMEOUT_HOURS = 720;

interface FormState {
  emailNotifsEnabled: boolean;
  maintenanceMode: boolean;
  maxBidIncrement: string;
  minListingPrice: string;
  reviewTimeoutHours: string;
  supportEmail: string;
}

interface AdminUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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

const EMPTY_FORM: FormState = {
  emailNotifsEnabled: true,
  maintenanceMode: false,
  maxBidIncrement: '',
  minListingPrice: '',
  reviewTimeoutHours: '',
  supportEmail: '',
};

export default function AdminSettings() {
  const { user, logout, changePassword } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [currentPwError, setCurrentPwError] = useState('');

  // BV-018: search-by-email is the whole lookup -- there is no general user directory, and
  // this is the one occasional, support-driven action that needs one.
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUser[] | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [anonymizingUser, setAnonymizingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    api.get('/settings')
      .then((s) =>
        setForm({
          emailNotifsEnabled: s.emailNotifsEnabled,
          maintenanceMode: s.maintenanceMode,
          maxBidIncrement: String(s.maxBidIncrement),
          minListingPrice: String(s.minListingPrice),
          reviewTimeoutHours: String(s.reviewTimeoutHours),
          supportEmail: s.supportEmail,
        }),
      )
      .catch(() => showToast({ type: 'error', title: 'Load Failed', message: 'Could not load platform settings.' }))
      .finally(() => setLoading(false));
  }, [showToast]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setUserSearchLoading(true);
    try {
      const results = await api.get(`/admin/users?email=${encodeURIComponent(userSearch.trim())}`);
      setUserResults(results);
    } catch {
      showToast({ type: 'error', title: 'Search Failed', message: 'Could not search for users.' });
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSave = async () => {
    const maxBid = Number(form.maxBidIncrement);
    const minPrice = Number(form.minListingPrice);
    const reviewHrs = Number(form.reviewTimeoutHours);
    if (
      !Number.isInteger(maxBid) || maxBid <= 0 || maxBid > MAX_BID_INCREMENT ||
      !Number.isInteger(minPrice) || minPrice <= 0 || minPrice > MAX_LISTING_PRICE ||
      !Number.isInteger(reviewHrs) || reviewHrs <= 0 || reviewHrs > MAX_REVIEW_TIMEOUT_HOURS
    ) {
      showToast({ type: 'error', title: 'Invalid Values', message: 'Numeric fields must be whole positive numbers within sensible limits.' });
      return;
    }
    if (!isStrictEmail(form.supportEmail)) {
      showToast({ type: 'error', title: 'Invalid Email', message: 'Enter a valid support email.' });
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/settings', {
        emailNotifsEnabled: form.emailNotifsEnabled,
        maintenanceMode: form.maintenanceMode,
        maxBidIncrement: maxBid,
        minListingPrice: minPrice,
        reviewTimeoutHours: reviewHrs,
        supportEmail: form.supportEmail.trim(),
      });
      showToast({ type: 'success', title: 'Settings Saved', message: 'Platform settings updated and applied.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err instanceof Error ? err.message : 'Could not save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`shrink-0 w-[42px] h-[24px] rounded-full transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${value ? 'bg-success-dark' : 'bg-border-medium'}`}
    >
      <span className={`absolute top-[4px] size-[16px] rounded-full bg-surface shadow-sm transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
    </button>
  );

  return (
    <AdminLayout active="Settings">
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
            <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Settings</h1>
            <p className="text-[12px] text-muted">Manage platform configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={loading}>
            <Save size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Save Changes</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-5 max-w-[800px]">

          {/* Admin Profile */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-[14px] text-navy">Admin Profile</h2>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="bg-primary size-[56px] rounded-full flex items-center justify-center shrink-0">
                <span className="font-extrabold text-[22px] text-white">{user?.name?.[0] ?? 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-navy">{user?.name ?? 'Admin BidVault'}</p>
                <p className="text-[12px] text-muted">{user?.email ?? 'admin@bidvault.com'}</p>
                <span className="inline-flex items-center mt-1 bg-primary-surface border border-[rgba(208,2,27,0.2)] font-bold text-[10px] text-primary px-2 py-[2px] rounded-full">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-[14px] text-navy">Security</h2>
            </div>
            <div className="p-5">
              {!showPwForm ? (
                <button
                  onClick={() => setShowPwForm(true)}
                  className="w-full border border-border-medium font-semibold text-[13px] text-tertiary py-2.5 rounded-sm hover:bg-bg hover:border-primary hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Change Password
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Input
                    id="admin-current-password"
                    label="Current Password"
                    type="password"
                    value={currentPw}
                    onChange={e => { setCurrentPw(e.target.value); setCurrentPwError(''); }}
                    placeholder="Your current password"
                    error={currentPwError}
                  />
                  <Input
                    id="admin-new-password"
                    label="New Password"
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwError(''); }}
                    placeholder="Min. 8 characters"
                    rightIcon={
                      <button
                        type="button"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPw(v => !v)}
                        className="text-muted hover:text-body transition-colors"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                    error={pwError}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-sm"
                      onClick={() => { setShowPwForm(false); setNewPw(''); setCurrentPw(''); setPwError(''); setCurrentPwError(''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-sm"
                      loading={pwLoading}
                      onClick={async () => {
                        setCurrentPwError('');
                        setPwError('');
                        if (!currentPw.trim()) { setCurrentPwError('Current password is required'); return; }
                        if (newPw.length < 8) { setPwError('Min. 8 characters'); return; }
                        setPwLoading(true);
                        const result = await changePassword(currentPw, newPw);
                        setPwLoading(false);
                        if (result.success) {
                          setShowPwForm(false); setNewPw(''); setCurrentPw(''); setPwError(''); setCurrentPwError('');
                          showToast({ type: 'success', title: 'Password Changed', message: 'Your password has been updated.' });
                        } else {
                          const message = result.error || 'Failed to change password.';
                          if (/current password/i.test(message)) setCurrentPwError(message);
                          else setPwError(message);
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-bg">
                <button
                  onClick={logout}
                  className="w-full text-left font-semibold text-[12px] text-destructive hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  Sign out of this device →
                </button>
              </div>
            </div>
          </div>

          {/* User account deletion (BV-018) — support-driven, by email search */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-[14px] text-navy">Delete a User Account</h2>
              <p className="text-[11px] text-muted mt-0.5">For a request sent to privacy@bidvault.com — search by email, then delete.</p>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchUsers(); } }}
                />
                <Button onClick={searchUsers} loading={userSearchLoading} size="md">Search</Button>
              </div>

              {userResults !== null && (
                <div className="mt-4 flex flex-col divide-y divide-bg border border-border-light rounded-sm overflow-hidden">
                  {userResults.length === 0 ? (
                    <p className="text-[12px] text-muted p-3">No matching accounts.</p>
                  ) : (
                    userResults.map(u => (
                      <div key={u.userId} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] text-secondary truncate">{u.name} <span className="font-normal text-muted">· {u.role}</span></p>
                          <p className="text-[11px] text-placeholder truncate">{u.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-error text-error hover:bg-error-bg shrink-0"
                          onClick={() => setAnonymizingUser(u)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="bg-surface border border-border-light rounded-md p-5">
              <div className="h-4 w-40 bg-border-light rounded animate-pulse mb-4" />
              <div className="h-10 bg-border-light rounded animate-pulse mb-3" />
              <div className="h-10 bg-border-light rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Platform Toggles */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Platform Controls</h2>
                  <p className="text-[12px] text-muted mt-0.5">Enable or disable platform-wide features</p>
                </div>
                <div className="divide-y divide-surface-raised">
                  {([
                    { label: 'Email Notifications', sub: 'Send activity emails (bids, listing updates, auctions, payments)', key: 'emailNotifsEnabled' as const, danger: false },
                    { label: 'Maintenance Mode', sub: 'Block non-admin access and show a maintenance page', key: 'maintenanceMode' as const, danger: true },
                  ] as const).map((t) => (
                    <div key={t.label} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div>
                        <p className="font-semibold text-[13px] text-secondary">{t.label}</p>
                        <p className="text-[12px] text-muted">{t.sub}</p>
                        {t.danger && form[t.key] && (
                          <p className="text-[11px] text-destructive font-medium mt-1 flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" />
                            Non-admins are currently locked out — save to apply, toggle off to restore access.
                          </p>
                        )}
                      </div>
                      <Toggle value={form[t.key]} onChange={() => update(t.key, !form[t.key])} />
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className="contents">
                {/* Auction Rules */}
                <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-light">
                    <h2 className="font-bold text-[14px] text-navy">Auction Rules</h2>
                    <p className="text-[12px] text-muted mt-0.5">Enforced when sellers create listings; review timeout flags overdue items</p>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { label: 'Min. Listing Price (PKR)', key: 'minListingPrice' as const, max: MAX_LISTING_PRICE },
                      { label: 'Max. Bid Increment (PKR)', key: 'maxBidIncrement' as const, max: MAX_BID_INCREMENT },
                      { label: 'Review Timeout (hours)', key: 'reviewTimeoutHours' as const, max: MAX_REVIEW_TIMEOUT_HOURS },
                    ] as const).map((f) => (
                      <Input
                        key={f.label}
                        label={f.label}
                        type="number"
                        min={1}
                        max={f.max}
                        step={1}
                        value={form[f.key]}
                        onChange={(e) => update(f.key, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Contact & Branding */}
                <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-light">
                    <h2 className="font-bold text-[14px] text-navy">Branding & Contact</h2>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <Input label="Platform Name" type="text" value={PLATFORM_NAME} readOnly className="bg-bg text-placeholder cursor-not-allowed" />
                    <Input label="Support Email" type="email" value={form.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
                  </div>
                </div>
              </form>
            </>
          )}

        </div>

        {anonymizingUser && (
          <AnonymizeUserModal
            target={anonymizingUser}
            onClose={() => setAnonymizingUser(null)}
            onDone={() => {
              showToast({ type: 'success', title: 'Account Deleted', message: `${anonymizingUser.name}'s account has been deleted.` });
              setAnonymizingUser(null);
              setUserResults(prev => prev?.filter(u => u.userId !== anonymizingUser.userId) ?? null);
            }}
          />
        )}
        </>
      )}
    </AdminLayout>
  );
}
