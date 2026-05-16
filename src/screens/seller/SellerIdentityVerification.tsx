import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Menu, X } from 'lucide-react';
import {
  IconBidVaultLogo, IconDashboard, IconList, IconUsers,
  IconUser, IconIdCard, IconPhone, IconDocument, IconUpload,
  IconCheckGreen, IconCheckbox, IconWarning,
} from '../../components/Icons';

function SellerNav({ active }: { active: string }) {
  const { user, logout } = useAuth();
  const status = user?.verificationStatus ?? 'UNVERIFIED';
  const badgeText = status === 'VERIFIED' ? 'Verified Seller' : status === 'PENDING' ? 'Under Review' : 'Unverified';
  const badgeClass = status === 'VERIFIED' ? 'border-[#1a7a4a] text-[#1a7a4a]' : status === 'PENDING' ? 'border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.1)]' : 'border-[#d0021b] text-[#d0021b]';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#0b1f3a] sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between px-4 sm:px-8 h-[60px]">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex gap-[10px] items-center">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-6">
            {[
              { label: 'Dashboard', path: '/seller/dashboard' },
              { label: 'Verification', path: '/seller/identity-verification' },
            ].map(n => (
              <Link key={n.label} to={n.path} className={`font-semibold text-[13px] transition-colors ${n.label === active ? 'text-white border-b-2 border-white pb-1' : 'text-[rgba(255,255,255,0.55)] hover:text-white'}`}>{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className={`border font-bold text-[11px] px-3 py-1 rounded-[99px] ${badgeClass}`}>{badgeText}</span>
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'S'}</span>
          </div>
          <span className="font-semibold text-[13px] text-white">{user?.name ?? 'Seller'}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.45)] hover:text-white ml-2 transition-colors">Logout</button>
        </div>
        <button className="md:hidden p-2 rounded-[6px] hover:bg-[rgba(255,255,255,0.08)]" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#0d2545] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-1">
          <Link to="/seller/dashboard" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">Dashboard</Link>
          <span className="font-semibold text-[14px] text-white py-2">Verification</span>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
            <span className="font-semibold text-[13px] text-white">{user?.name ?? 'Seller'}</span>
            <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}

function FileUploadSlot({ label, required = true }: { label: string; required?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="font-bold text-[12px] text-[#343a40]">
        {label} {required ? <span className="text-[#d0021b]">*</span> : <span className="text-[#6c757d] font-medium">(optional)</span>}
      </label>
      {file ? (
        <div className="bg-[#f0faf4] border border-[rgba(26,122,74,0.3)] rounded-[8px] flex items-center gap-3 px-4 py-3">
          <div className="bg-[#e9ecef] flex items-center justify-center rounded-[6px] size-[32px] shrink-0">
            <IconDocument className="size-[14px]" color="#1a7a4a" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[12px] text-[#1a7a4a] truncate">{file.name}</p>
            <p className="text-[11px] text-[#6c757d]">{(file.size / 1024 / 1024).toFixed(1)} MB · Uploaded</p>
          </div>
          <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[22px] shrink-0">
            <IconCheckGreen className="h-[7px] w-[9px]" />
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-[#dee2e6] rounded-[8px] flex flex-col items-center justify-center py-5 sm:py-6 gap-2 cursor-pointer hover:border-[#d0021b] hover:bg-[#fff0f2] transition-colors">
          <IconUpload className="size-[22px]" color="#adb5bd" />
          <p className="font-semibold text-[12px] text-[#6c757d]">Upload {label}</p>
          <p className="text-[10px] text-[#adb5bd]">PNG, JPG or PDF · Max <span className="font-bold text-[#d0021b]">5MB</span></p>
          <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  );
}

export default function SellerIdentityVerification() {
  const navigate = useNavigate();
  const { user, submitVerification } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!fullName || !cnic || !phone || !city || !address) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill all required fields.' });
      return;
    }
    if (!decl1 || !decl2) {
      showToast({ type: 'error', title: 'Declaration Required', message: 'You must accept both declarations.' });
      return;
    }
    setLoading(true);
    const res = await submitVerification();
    setLoading(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Submitted!', message: 'Your verification is under admin review.' });
      navigate('/seller/verification-status');
    } else {
      showToast({ type: 'error', title: 'Error', message: res.error || 'Submission failed.' });
    }
  };

  const sidebarItems = [
    { label: 'Dashboard', icon: <IconDashboard />, path: '/seller/dashboard' },
    { label: 'Identity Verification', icon: <IconUsers />, path: '/seller/identity-verification', active: true },
    { label: 'My Listings', icon: <IconList />, path: '/seller/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <SellerNav active="Verification" />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block bg-white border-r border-[#e9ecef] w-[200px] shrink-0 min-h-[calc(100vh-60px)] p-4">
          <p className="font-bold text-[10px] text-[#adb5bd] tracking-[0.8px] uppercase mb-3 px-2">Seller Account</p>
          <nav className="flex flex-col gap-1">
            {sidebarItems.map(item => (
              <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-3 py-[9px] rounded-[8px] ${item.active ? 'bg-[#fff0f2] text-[#d0021b]' : 'text-[#6c757d] hover:bg-[#f8f9fa]'}`}>
                <span>{item.icon}</span>
                <span className={`font-semibold text-[13px] ${item.active ? 'text-[#d0021b]' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 px-3">
            <p className="font-bold text-[10px] text-[#adb5bd] tracking-[0.8px] uppercase mb-2">Why Verify?</p>
            <p className="text-[11px] text-[#6c757d] leading-[16px]">Verified sellers can create listings, get a trust badge, and reach more buyers.</p>
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-[220px] bg-white border-r border-[#e9ecef] flex flex-col p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-[10px] text-[#adb5bd] tracking-[0.8px] uppercase">Seller Account</p>
                <button onClick={() => setSidebarOpen(false)}><X size={16} className="text-[#6c757d]" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {sidebarItems.map(item => (
                  <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-[9px] rounded-[8px] ${item.active ? 'bg-[#fff0f2] text-[#d0021b]' : 'text-[#6c757d] hover:bg-[#f8f9fa]'}`}>
                    <span>{item.icon}</span>
                    <span className={`font-semibold text-[13px] ${item.active ? 'text-[#d0021b]' : ''}`}>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-1 bg-[rgba(11,31,58,0.4)]" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[900px]">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden mb-4 flex items-center gap-2 text-[13px] font-semibold text-[#6c757d] border border-[#e9ecef] px-3 py-2 rounded-[8px] hover:bg-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={15} /> Menu
          </button>

          <h1 className="font-extrabold text-[20px] sm:text-[24px] text-[#0b1f3a] mb-1">Seller Identity Verification</h1>
          <p className="text-[13px] text-[#6c757d] mb-4 sm:mb-5">Submit your identity documents to unlock listing privileges</p>

          <div className="bg-[#fffbeb] border border-[#fde68a] flex gap-3 items-center px-4 py-3 rounded-[8px] mb-5 sm:mb-6">
            <IconWarning />
            <p className="text-[12px] text-[#d97706] font-medium">Your account is not yet verified. Complete identity verification to create auction listings.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                  <IconUser className="size-[18px]" />
                </div>
                <div>
                  <h2 className="font-bold text-[14px] text-[#0b1f3a]">Personal Information</h2>
                  <p className="text-[12px] text-[#6c757d]">Your legal name and CNIC details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Full legal name <span className="text-[#d0021b]">*</span></label>
                  <div className="relative">
                    <input className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" value={fullName} onChange={e => setFullName(e.target.value)} />
                    <span className="absolute left-[14px] top-[15px]"><IconUser className="size-[16px]" /></span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">CNIC number <span className="text-[#d0021b]">*</span></label>
                  <div className="relative">
                    <input className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" placeholder="35201-1234567-8" value={cnic} onChange={e => setCnic(e.target.value)} />
                    <span className="absolute left-[14px] top-[15px]"><IconIdCard /></span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Phone number <span className="text-[#d0021b]">*</span></label>
                  <div className="relative">
                    <input className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" placeholder="+92 300 0000000" value={phone} onChange={e => setPhone(e.target.value)} />
                    <span className="absolute left-[14px] top-[15px]"><IconPhone /></span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">City / District <span className="text-[#d0021b]">*</span></label>
                  <input className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" placeholder="Islamabad" value={city} onChange={e => setCity(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40]">Full address <span className="text-[#d0021b]">*</span></label>
                <textarea className="bg-white border border-[#dee2e6] px-4 py-3 rounded-[8px] text-[14px] text-[#343a40] w-full h-[80px] resize-none outline-none focus:border-[#d0021b]" placeholder="House #, Street, Area, City" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>

            {/* Identity Documents */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                  <IconDocument className="size-[18px]" color="#d0021b" />
                </div>
                <div>
                  <h2 className="font-bold text-[14px] text-[#0b1f3a]">Identity Documents</h2>
                  <p className="text-[12px] text-[#6c757d]">Upload clear photos of your CNIC (front & back)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FileUploadSlot label="CNIC — Front side" />
                <FileUploadSlot label="CNIC — Back side" />
              </div>
              <FileUploadSlot label="Supporting document" required={false} />
            </div>

            {/* Declaration */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-6 mb-5 sm:mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                  <IconDocument className="size-[18px]" color="#d0021b" />
                </div>
                <div>
                  <h2 className="font-bold text-[14px] text-[#0b1f3a]">Declaration</h2>
                  <p className="text-[12px] text-[#6c757d]">Please confirm the following before submitting</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { state: decl1, set: setDecl1, text: 'I confirm that all information and documents provided are genuine and accurate.' },
                  { state: decl2, set: setDecl2, text: "I agree to BidVault's Seller Terms of Service and Marketplace Policies." },
                ].map(({ state, set, text }, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <button type="button" onClick={() => set(p => !p)} className={`border-2 flex items-center justify-center p-[2px] rounded-[4px] size-[18px] shrink-0 mt-px transition-colors ${state ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#dee2e6]'}`}>
                      {state && <IconCheckbox />}
                    </button>
                    <p className="text-[12.5px] text-[#495057]">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Link to="/login" className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa] text-center transition-colors">Cancel</Link>
              <button type="submit" disabled={loading} className="bg-[#d0021b] flex gap-2 items-center justify-center font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors disabled:opacity-60">
                {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit for Verification →'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
