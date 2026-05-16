import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconDashboard, IconList, IconUsers,
  IconCheckGreen, IconInfo,
} from '../../components/Icons';

function SellerNav({ active }: { active: string }) {
  const { user, logout } = useAuth();
  const status = user?.verificationStatus ?? 'UNVERIFIED';
  const badgeText = status === 'VERIFIED' ? 'Verified Seller' : status === 'PENDING' ? 'Under Review' : 'Unverified Seller';
  const badgeClass = status === 'VERIFIED' ? 'border-[#1a7a4a] text-[#1a7a4a]' : status === 'PENDING' ? 'border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.1)]' : 'border-[#d0021b] text-[#d0021b]';

  return (
    <header className="bg-[#0b1f3a] flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-8">
        <div className="flex gap-[10px] items-center">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
            <IconBidVaultLogo className="size-[18px]" />
          </div>
          <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </div>
        <nav className="flex gap-6">
          {[
            { label: 'Dashboard', path: '/seller/dashboard' },
            { label: 'Verification', path: '/seller/identity-verification' },
          ].map(n => (
            <Link key={n.label} to={n.path} className={`font-semibold text-[13px] ${n.label === active ? 'text-white border-b-2 border-white pb-1' : 'text-[rgba(255,255,255,0.55)] hover:text-white'}`}>{n.label}</Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className={`border font-bold text-[11px] px-3 py-1 rounded-[99px] ${badgeClass}`}>{badgeText}</span>
        <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
          <span className="font-bold text-[13px] text-white">{user?.name[0] ?? 'S'}</span>
        </div>
        <span className="font-semibold text-[13px] text-white">{user?.name ?? 'Seller'}</span>
        <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-2">Logout</button>
      </div>
    </header>
  );
}

export default function SellerVerificationStatus() {
  const navigate = useNavigate();
  const { user, simulateAdminApproval } = useAuth();
  const { showToast } = useToast();

  const status = user?.verificationStatus ?? 'UNVERIFIED';
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';

  const handleDemoApprove = () => {
    simulateAdminApproval();
    showToast({ type: 'success', title: 'Admin Approved!', message: 'Your seller account is now verified.' });
  };

  const stepStatus = (n: number) => {
    if (isVerified) return n <= 3 ? 'done' : n === 4 ? 'active' : 'pending';
    if (isPending) return n === 1 ? 'done' : n === 2 ? 'active' : 'pending';
    return n === 1 ? 'active' : 'pending';
  };

  const stepSubs: Record<number, string> = isVerified
    ? { 1: 'Submitted', 2: 'Completed', 3: 'Approved!', 4: 'Unlocked' }
    : isPending
    ? { 1: 'Submitted', 2: 'In Progress', 3: 'Pending', 4: 'Locked' }
    : { 1: 'Not started', 2: 'Pending', 3: 'Pending', 4: 'Locked' };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <SellerNav active="Verification" />

      <div className="flex">
        <aside className="bg-white border-r border-[#e9ecef] w-[200px] shrink-0 min-h-[calc(100vh-64px)] p-4">
          <p className="font-bold text-[10px] text-[#adb5bd] tracking-[0.8px] uppercase mb-3 px-2">Seller Account</p>
          <nav className="flex flex-col gap-1">
            {[
              { label: 'Dashboard', icon: <IconDashboard />, path: '/seller/dashboard' },
              { label: 'Identity Verification', icon: <IconUsers />, path: '/seller/verification-status', active: true },
              { label: 'My Listings', icon: <IconList />, path: '/seller/dashboard' },
            ].map(item => (
              <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-3 py-[9px] rounded-[8px] ${item.active ? 'bg-[#fff0f2] text-[#d0021b]' : 'text-[#6c757d] hover:bg-[#f8f9fa]'}`}>
                <span>{item.icon}</span>
                <span className={`font-semibold text-[13px] ${item.active ? 'text-[#d0021b]' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-10">
          <h1 className="font-extrabold text-[24px] text-[#0b1f3a] mb-1">Verification Status</h1>
          <p className="text-[13px] text-[#6c757d] mb-8">
            {isVerified ? 'Your account is verified. You can now create listings!' : 'Your submission is being reviewed by our admin team'}
          </p>

          {/* Progress stepper */}
          <div className="flex items-start gap-0 mb-8 max-w-[700px]">
            {[1, 2, 3, 4].map((n, i) => {
              const labels = ['Submitted', 'Admin Review', 'Approved', 'List Items'];
              const s = stepStatus(n);
              return (
                <div key={n} className="flex-1 flex flex-col items-center relative">
                  {i < 3 && (
                    <div className={`absolute top-[14px] left-1/2 right-[-50%] h-[2px] ${s === 'done' || s === 'active' ? 'bg-[#d0021b]' : 'bg-[#e9ecef]'}`} />
                  )}
                  <div className={`relative z-10 flex items-center justify-center rounded-full size-[28px] border-2 ${s === 'done' ? 'bg-[#fff0f2] border-[#d0021b]' : s === 'active' ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#e9ecef]'}`}>
                    {s === 'done'
                      ? <svg className="h-[8px] w-[10px]" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#d0021b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <span className={`font-extrabold text-[12px] ${s === 'active' ? 'text-white' : 'text-[#adb5bd]'}`}>{n}</span>
                    }
                  </div>
                  <p className={`font-bold text-[11px] mt-2 ${s === 'active' ? 'text-[#d0021b]' : s === 'done' ? 'text-[#495057]' : 'text-[#adb5bd]'}`}>{labels[i]}</p>
                  <p className="text-[10px] text-[#adb5bd] mt-[2px]">{stepSubs[n]}</p>
                </div>
              );
            })}
          </div>

          {/* Status banner */}
          {isVerified ? (
            <div className="bg-[#f0faf4] border border-[rgba(26,122,74,0.3)] rounded-[12px] p-5 mb-5 max-w-[700px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[32px]">
                  <IconCheckGreen className="h-[10px] w-[13px]" />
                </div>
                <h3 className="font-bold text-[15px] text-[#1a7a4a]">Verification Approved!</h3>
              </div>
              <p className="text-[12.5px] text-[#065f46] leading-[19px]">
                Your seller account is now verified. You can create auction listings and start selling on BidVault.
              </p>
            </div>
          ) : (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] p-5 mb-5 max-w-[700px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#fde68a] flex items-center justify-center rounded-full size-[32px]">
                  <span className="text-[16px]">⏳</span>
                </div>
                <h3 className="font-bold text-[15px] text-[#d97706]">Under Admin Review</h3>
              </div>
              <p className="text-[12.5px] text-[#92400e] leading-[19px]">
                Your documents are being reviewed. You'll be notified at <span className="font-bold">{user?.email}</span> once complete. This typically takes 1–2 business days.
              </p>
            </div>
          )}

          {/* Submitted Documents */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-6 max-w-[700px] mb-5">
            <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-5">Submitted Documents</h3>
            <div className="flex flex-col gap-1">
              {[
                { icon: '👤', label: 'Full Legal Name', value: user?.name ?? '—' },
                { icon: '💳', label: 'CNIC Number', value: '35201-1234567-8' },
                { icon: '📷', label: 'CNIC Front Photo', value: 'cnic_front.jpg · Uploaded' },
              ].map((d, i, arr) => (
                <div key={i}>
                  <div className="flex items-center gap-4 py-4">
                    <div className="bg-[#f8f9fa] flex items-center justify-center rounded-[8px] size-[40px] text-[18px] shrink-0">{d.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-[11px] text-[#6c757d]">{d.label}</p>
                      <p className="font-bold text-[13px] text-[#343a40]">{d.value}</p>
                    </div>
                    <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[22px]">
                      <IconCheckGreen className="h-[7px] w-[9px]" />
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="bg-[#e9ecef] h-px" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#eff6ff] border border-[#bfdbfe] flex gap-3 items-center px-4 py-3 rounded-[8px] max-w-[700px] mb-6">
            <IconInfo color="#1e40af" />
            <p className="text-[12px] text-[#1e40af] font-medium">
              If your verification is rejected, you will be notified by email with the reason and will be able to resubmit.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 max-w-[700px]">
            {isVerified ? (
              <>
                <button
                  onClick={() => navigate('/seller/dashboard')}
                  className="bg-[#0b1f3a] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#1a3356] transition-colors"
                >
                  Go to Dashboard →
                </button>
                <button
                  onClick={() => navigate('/seller/create-listing/step-1')}
                  className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors"
                >
                  Create Listing →
                </button>
              </>
            ) : (
              <button
                onClick={handleDemoApprove}
                className="bg-[#0b1f3a] font-bold text-[13px] text-white px-5 py-3 rounded-[8px] hover:bg-[#1a3356] transition-colors"
              >
                Demo: Simulate Admin Approval
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
