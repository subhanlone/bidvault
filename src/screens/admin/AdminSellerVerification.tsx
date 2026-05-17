import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { mockApi } from '../../services/mockApi';
import { CheckCircle2, Check, Menu, X } from 'lucide-react';
import {
  IconBidVaultLogo, IconDashboard, IconList, IconUsers,
  IconAnalytics, IconSettings,
} from '../../components/Icons';
import type { User } from '../../types';

function AdminSidebarContent({ active, onClose }: { active: string; onClose?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pendingListings } = useAuction();
  const pendingCount = pendingListings.length;

  const items = [
    { label: 'Dashboard', icon: <IconDashboard />, path: '/admin/dashboard' },
    { label: 'Live Auctions', icon: <IconList />, badge: '6', path: '/admin/live-auctions' },
    { label: 'Listing Review', icon: <IconList />, badge: String(pendingCount), path: '/admin/dashboard' },
    { label: 'Seller Verification', icon: <IconUsers />, path: '/admin/seller-verification' },
    { label: 'Analytics', icon: <IconAnalytics />, path: '/admin/analytics' },
    { label: 'Settings', icon: <IconSettings />, path: '/admin/settings' },
  ];

  return (
    <aside className="bg-[#0b1f3a] flex flex-col w-[200px] shrink-0 min-h-screen">
      <div className="flex gap-[10px] items-center px-5 py-5 border-b border-[rgba(255,255,255,0.08)]">
        <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[32px]">
          <IconBidVaultLogo className="size-[16px]" />
        </div>
        <span className="font-extrabold text-[18px] text-white tracking-[-0.3px]">
          Bid<span className="text-[#d0021b]">Vault</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-[rgba(255,255,255,0.5)] hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-[2px] p-3 flex-1">
        {items.map(item => (
          <div
            key={item.label}
            onClick={() => { navigate(item.path); onClose?.(); }}
            className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[8px] cursor-pointer ${
              item.label === active
                ? 'bg-[rgba(208,2,27,0.15)] text-[#ff6b7a]'
                : 'text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-semibold text-[12.5px] flex-1">{item.label}</span>
            {item.badge && (
              <span className={`font-bold text-[10px] px-[6px] py-[2px] rounded-[99px] ${item.label === active ? 'bg-[#d0021b] text-white' : 'bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)]'}`}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-[10px] px-4 py-4 border-t border-[rgba(255,255,255,0.08)]">
        <div className="bg-[#d0021b] flex items-center justify-center rounded-full size-[32px] shrink-0">
          <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'A'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[12px] text-white leading-tight truncate">{user?.name ?? 'Admin'}</p>
          <p className="text-[10px] text-[rgba(255,255,255,0.45)]">Admin</p>
        </div>
        <button onClick={logout} className="text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white shrink-0">Logout</button>
      </div>
    </aside>
  );
}

export default function AdminSellerVerification() {
  const { showToast } = useToast();
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    mockApi.getPendingSellerVerifications().then(res => {
      if (res.success && res.data) setSellers(res.data);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (seller: User) => {
    setProcessing(seller.userId);
    await mockApi.approveSellerVerification(seller.userId);
    setSellers(prev => prev.filter(s => s.userId !== seller.userId));
    setProcessing(null);
    showToast({ type: 'success', title: 'Seller Approved', message: `${seller.name} is now a verified seller.` });
  };

  const handleReject = async (seller: User) => {
    if (!rejectReason.trim()) {
      showToast({ type: 'error', title: 'Reason Required', message: 'Please enter a rejection reason.' });
      return;
    }
    setProcessing(seller.userId);
    await mockApi.rejectSellerVerification(seller.userId);
    setSellers(prev => prev.filter(s => s.userId !== seller.userId));
    setRejecting(null);
    setRejectReason('');
    setProcessing(null);
    showToast({ type: 'info', title: 'Seller Rejected', message: `${seller.name}'s verification was rejected.` });
  };

  const pending = sellers.length;

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-[200px] md:shrink-0 md:min-h-screen">
        <AdminSidebarContent active="Seller Verification" />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <AdminSidebarContent active="Seller Verification" onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 bg-[rgba(0,0,0,0.4)]" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-[6px] border border-[#e9ecef] hover:bg-[#f8f9fa]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-[#495057]" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-[#0b1f3a]">Seller Verification</h1>
              <p className="text-[12px] text-[#6c757d]">Review and approve seller identity submissions</p>
            </div>
          </div>
          {pending > 0 && (
            <span className="bg-[#f59e0b] font-bold text-[11px] text-white px-3 py-[5px] rounded-[99px]">
              {pending} Pending
            </span>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Pending Review', value: String(pending), color: 'text-[#d97706]' },
              { label: 'Approved Today', value: '0', color: 'text-[#1a7a4a]' },
              { label: 'Rejected Today', value: '0', color: 'text-[#ef4444]' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
                <p className="font-medium text-[11px] sm:text-[12px] text-[#6c757d] mb-1 sm:mb-2">{s.label}</p>
                <p className={`font-extrabold text-[28px] sm:text-[32px] ${s.color} leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Sellers list */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px]">
            <div className="px-4 sm:px-5 py-4 border-b border-[#e9ecef]">
              <h2 className="font-bold text-[14px] text-[#0b1f3a]">Pending Verifications</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-8 border-[3px] border-[#d0021b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex justify-center mb-4"><CheckCircle2 size={48} strokeWidth={1.3} className="text-[#1a7a4a]" /></div>
                <h3 className="font-bold text-[16px] text-[#0b1f3a] mb-1">All caught up!</h3>
                <p className="text-[13px] text-[#6c757d]">No pending seller verifications.</p>
              </div>
            ) : (
              <>
                {/* Desktop header */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_180px_120px_100px_180px] gap-4 px-5 py-3 text-[11px] text-[#adb5bd] font-bold uppercase tracking-[0.5px] border-b border-[#f8f9fa]">
                  <span>Seller</span>
                  <span>Email</span>
                  <span>Submitted</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div className="flex flex-col">
                  {sellers.map(seller => (
                    <div key={seller.userId} className="flex flex-col border-b border-[#f8f9fa] last:border-0">
                      {/* Desktop row */}
                      <div className="hidden sm:grid sm:grid-cols-[1fr_180px_120px_100px_180px] gap-4 items-center px-5 py-4 hover:bg-[#f8f9fa] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-[#0b1f3a] size-[36px] rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                            {seller.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[13px] text-[#343a40] truncate">{seller.name}</p>
                            <p className="text-[10px] text-[#adb5bd]">{seller.userId}</p>
                          </div>
                        </div>
                        <p className="text-[12px] text-[#495057] truncate">{seller.email}</p>
                        <p className="text-[12px] text-[#6c757d]">
                          {new Date(seller.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className="bg-[#fffbeb] border border-[#fde68a] font-bold text-[11px] text-[#d97706] px-2 py-1 rounded-[6px] w-fit">
                          Pending
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={processing === seller.userId}
                            onClick={() => handleApprove(seller)}
                            className="bg-[#1a7a4a] font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-[#145f39] disabled:opacity-50 transition-colors"
                          >
                            {processing === seller.userId ? '...' : '✓ Approve'}
                          </button>
                          <button
                            disabled={processing === seller.userId}
                            onClick={() => setRejecting(rejecting === seller.userId ? null : seller.userId)}
                            className="border border-[#ef4444] font-bold text-[11px] text-[#ef4444] px-3 py-[5px] rounded-[6px] hover:bg-[#fff5f5] disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Mobile card */}
                      <div className="sm:hidden px-4 py-3 hover:bg-[#f8f9fa] transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-[#0b1f3a] size-[40px] rounded-full flex items-center justify-center text-white font-bold text-[15px] shrink-0">
                            {seller.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[13px] text-[#343a40] truncate">{seller.name}</p>
                            <p className="text-[11px] text-[#6c757d] truncate">{seller.email}</p>
                          </div>
                          <span className="bg-[#fffbeb] border border-[#fde68a] font-bold text-[10px] text-[#d97706] px-2 py-1 rounded-[6px] shrink-0">
                            Pending
                          </span>
                        </div>
                        <p className="text-[11px] text-[#adb5bd] mb-3">
                          Submitted {new Date(seller.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            disabled={processing === seller.userId}
                            onClick={() => handleApprove(seller)}
                            className="flex-1 bg-[#1a7a4a] font-bold text-[12px] text-white py-2 rounded-[6px] hover:bg-[#145f39] disabled:opacity-50 transition-colors"
                          >
                            {processing === seller.userId ? '...' : '✓ Approve'}
                          </button>
                          <button
                            disabled={processing === seller.userId}
                            onClick={() => setRejecting(rejecting === seller.userId ? null : seller.userId)}
                            className="flex-1 border border-[#ef4444] font-bold text-[12px] text-[#ef4444] py-2 rounded-[6px] hover:bg-[#fff5f5] disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Reject reason panel */}
                      {rejecting === seller.userId && (
                        <div className="mx-4 sm:mx-5 mb-4 p-4 bg-[#fff5f5] border border-[#fecaca] rounded-[8px]">
                          <p className="font-bold text-[12px] text-[#ef4444] mb-2">Rejection Reason</p>
                          <textarea
                            className="w-full border border-[#fecaca] rounded-[6px] p-3 text-[13px] text-[#343a40] outline-none focus:border-[#ef4444] resize-none"
                            rows={3}
                            placeholder="e.g. Documents are unclear or incomplete..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              disabled={processing === seller.userId}
                              onClick={() => handleReject(seller)}
                              className="bg-[#ef4444] font-bold text-[12px] text-white px-4 py-2 rounded-[6px] hover:bg-[#dc2626] disabled:opacity-50"
                            >
                              {processing === seller.userId ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              onClick={() => { setRejecting(null); setRejectReason(''); }}
                              className="border border-[#dee2e6] font-semibold text-[12px] text-[#6c757d] px-4 py-2 rounded-[6px] hover:bg-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Document checklist */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[12px] p-4">
            <p className="font-bold text-[13px] text-[#1e40af] mb-2">Verification Checklist</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-1">
              {['Full Legal Name matches CNIC', 'CNIC front & back photos clear', 'CNIC number valid format (XXXXX-XXXXXXX-X)', 'Address is complete', 'Contact number verified', 'No duplicate accounts'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Check size={14} strokeWidth={2.5} className="text-[#1e40af] shrink-0" />
                  <span className="text-[11px] text-[#1e40af]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
