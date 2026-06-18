import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';
import { Button, Input } from '../../components/ui';

const SETTINGS_KEY = 'bidvault_admin_settings_v1';
const PLATFORM_NAME = 'BidVault';

interface SettingsState {
  emailNotifs:       boolean;
  maintenanceMode:   boolean;
  maxBidIncrement:   string;
  minListingPrice:   string;
  reviewTimeout:     string;
  supportEmail:      string;
}

const DEFAULT_SETTINGS: SettingsState = {
  emailNotifs:     true,
  maintenanceMode: false,
  maxBidIncrement: '500000',
  minListingPrice: '1000',
  reviewTimeout:   '48',
  supportEmail:    'support@bidvault.com',
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SettingsState>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      showToast({ type: 'success', title: 'Settings Saved', message: 'Platform settings saved to this device.' });
    } catch {
      showToast({ type: 'error', title: 'Save Failed', message: 'Could not save settings.' });
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
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:block md:w-[200px] md:shrink-0">
        <AdminSidebarContent active="Settings" />
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Settings" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-tertiary" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Settings</h1>
              <p className="text-[12px] text-muted">Manage platform configuration</p>
            </div>
          </div>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            <Save size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Save Changes</span>
          </Button>
        </header>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5 max-w-[800px]">

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

          {/* Platform Toggles */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-[14px] text-navy">Platform Controls</h2>
              <p className="text-[12px] text-muted mt-0.5">Enable or disable platform-wide features</p>
            </div>
            <div className="divide-y divide-surface-raised">
              {([
                { label: 'Email Notifications',   sub: 'Send bid/win alerts to buyers and sellers',          key: 'emailNotifs'     as const, danger: false },
                { label: 'Maintenance Mode',       sub: 'Show maintenance page to all users',                key: 'maintenanceMode' as const, danger: true  },
              ] as const).map(t => (
                <div key={t.label} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="font-semibold text-[13px] text-secondary">{t.label}</p>
                    <p className="text-[12px] text-muted">{t.sub}</p>
                    {t.danger && settings[t.key] && (
                      <p className="text-[11px] text-destructive font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} className="shrink-0" />
                        This setting is active
                      </p>
                    )}
                  </div>
                  <Toggle value={settings[t.key]} onChange={() => updateSetting(t.key, !settings[t.key])} />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="contents">
            {/* Auction Rules */}
            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              <div className="px-5 py-4 border-b border-border-light">
                <h2 className="font-bold text-[14px] text-navy">Auction Rules</h2>
                <p className="text-[12px] text-muted mt-0.5">Configure bidding and listing constraints</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { label: 'Min. Listing Price (PKR)', key: 'minListingPrice' as const, placeholder: '1000'   },
                  { label: 'Max. Bid Increment (PKR)', key: 'maxBidIncrement' as const, placeholder: '500000' },
                  { label: 'Review Timeout (hours)',   key: 'reviewTimeout'   as const, placeholder: '48'     },
                ] as const).map(f => (
                  <Input
                    key={f.label}
                    label={f.label}
                    type="number"
                    value={settings[f.key]}
                    onChange={e => updateSetting(f.key, e.target.value)}
                    placeholder={f.placeholder}
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
                <Input label="Support Email" type="email" value={settings.supportEmail} onChange={e => updateSetting('supportEmail', e.target.value)} />
              </div>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
