import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';

export default function AdminSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxBidIncrement, setMaxBidIncrement] = useState('500000');
  const [minListingPrice, setMinListingPrice] = useState('1000');
  const [reviewTimeout, setReviewTimeout] = useState('48');
  const [platformName] = useState('BidVault');
  const [supportEmail, setSupportEmail] = useState('support@bidvault.com');

  const handleSave = () => {
    showToast({ type: 'success', title: 'Settings Saved', message: 'Platform settings updated successfully.' });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`shrink-0 w-[42px] h-[24px] rounded-full transition-colors relative ${value ? 'bg-[#1a7a4a]' : 'bg-[#dee2e6]'}`}
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
            <button className="md:hidden p-2 rounded-[6px] border border-border-light hover:bg-bg" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-tertiary" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Settings</h1>
              <p className="text-[12px] text-muted">Manage platform configuration</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="bg-[#1a7a4a] flex items-center gap-2 font-bold text-[13px] text-white px-4 py-2.5 rounded-sm hover:bg-[#15643d] transition-colors"
          >
            <Save size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Save Changes</span>
          </button>
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
                <span className="inline-flex items-center mt-1 bg-primary-surface border border-[rgba(208,2,27,0.2)] font-bold text-[10px] text-primary px-2 py-[2px] rounded-[99px]">
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
            <div className="divide-y divide-[#f8f9fa]">
              {[
                { label: 'Auto-Approve Listings', sub: 'Skip manual review and publish listings immediately', value: autoApprove, set: setAutoApprove, danger: true },
                { label: 'Email Notifications', sub: 'Send bid/win alerts to buyers and sellers', value: emailNotifs, set: setEmailNotifs },
                { label: 'Maintenance Mode', sub: 'Show maintenance page to all users', value: maintenanceMode, set: setMaintenanceMode, danger: true },
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="font-semibold text-[13px] text-secondary">{t.label}</p>
                    <p className="text-[12px] text-muted">{t.sub}</p>
                    {t.danger && t.value && (
                      <p className="text-[11px] text-[#ef4444] font-medium mt-1">⚠ This setting is active</p>
                    )}
                  </div>
                  <Toggle value={t.value} onChange={() => t.set(v => !v)} />
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
              {[
                { label: 'Min. Listing Price (PKR)', value: minListingPrice, set: setMinListingPrice, placeholder: '1000' },
                { label: 'Max. Bid Increment (PKR)', value: maxBidIncrement, set: setMaxBidIncrement, placeholder: '500000' },
                { label: 'Review Timeout (hours)', value: reviewTimeout, set: setReviewTimeout, placeholder: '48' },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-2">
                  <label className="font-bold text-[12px] text-secondary">{f.label}</label>
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="border border-[#dee2e6] rounded-sm px-3 py-2.5 text-[13px] text-secondary outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Branding */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-[14px] text-navy">Branding & Contact</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-[12px] text-secondary">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  readOnly
                  className="border border-[#dee2e6] rounded-sm px-3 py-2.5 text-[13px] text-placeholder outline-none bg-bg cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-[12px] text-secondary">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="border border-[#dee2e6] rounded-sm px-3 py-2.5 text-[13px] text-secondary outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                />
              </div>
            </div>
          </div>
          </form>

          {/* Danger zone */}
          <div className="bg-surface border border-[#fecaca] rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#fecaca] bg-[#fff5f5]">
              <h2 className="font-bold text-[14px] text-[#ef4444]">Danger Zone</h2>
              <p className="text-[12px] text-[#ef4444] opacity-70 mt-0.5">Irreversible actions. Proceed with extreme caution.</p>
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 border border-[#fecaca] font-bold text-[12px] text-[#ef4444] px-4 py-2.5 rounded-sm hover:bg-[#fff5f5] transition-colors">
                Clear All Pending Listings
              </button>
              <button className="flex-1 border border-[#fecaca] font-bold text-[12px] text-[#ef4444] px-4 py-2.5 rounded-sm hover:bg-[#fff5f5] transition-colors">
                Reset Platform Statistics
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
