import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import { Button, Input } from '../../components/ui';
import { api } from '../../services/api';

const PLATFORM_NAME = 'BidVault';
const MAX_LISTING_PRICE = 100_000_000;
const MAX_BID_INCREMENT = 10_000_000;
const MAX_REVIEW_TIMEOUT_HOURS = 720;

interface PlatformSettings {
  emailNotifsEnabled: boolean;
  maintenanceMode: boolean;
  maxBidIncrement: number;
  minListingPrice: number;
  reviewTimeoutHours: number;
  supportEmail: string;
}

interface FormState {
  emailNotifsEnabled: boolean;
  maintenanceMode: boolean;
  maxBidIncrement: string;
  minListingPrice: string;
  reviewTimeoutHours: string;
  supportEmail: string;
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    api.get<PlatformSettings>('/settings')
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
    if (!/\S+@\S+\.\S+/.test(form.supportEmail)) {
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
        </>
      )}
    </AdminLayout>
  );
}
