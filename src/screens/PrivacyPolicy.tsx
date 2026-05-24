import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create an account on BidVault, we collect personal information including your full name, email address, and selected account role (Buyer or Seller). We also collect usage data such as bids placed, listings created, auction participation history, and device/browser metadata for security and fraud prevention.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your information is used solely to operate the BidVault platform: facilitating auctions, verifying seller identities, processing bids, sending transactional email notifications (bid confirmations, win alerts, listing approvals), and administering user accounts. We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
  },
  {
    title: '3. Seller Account Review',
    body: `Seller accounts are subject to admin review before listing privileges are granted. BidVault administrators may request additional information to confirm account legitimacy. Account review data is used solely to maintain platform integrity and is not shared externally. Rejected applications may be resubmitted after addressing the stated concerns.`,
  },
  {
    title: '4. Data Security',
    body: `We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), hashed password storage, and access controls. Admin review of sensitive data is logged and audited. Despite these measures, no online platform can guarantee absolute security — use strong, unique passwords and report suspicious activity immediately.`,
  },
  {
    title: '5. Cookies & Local Storage',
    body: `BidVault uses browser local storage to maintain your authenticated session and preserve preferences. We do not use third-party tracking cookies or advertising pixels. Session data is cleared upon logout.`,
  },
  {
    title: '6. Data Retention',
    body: `Active account data is retained for as long as your account exists. If you delete your account, personal data is removed within 30 days except where retention is required by law. Bid and transaction records may be retained for up to 3 years for dispute resolution and audit purposes.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at privacy@bidvault.com. We will respond within 14 business days. Note that deleting your account will forfeit any active bids or pending listings.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy periodically. Material changes will be communicated via email and a notice on the platform. Continued use of BidVault after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-navy border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex gap-[10px] items-center">
            <div className="bg-primary flex items-center justify-center rounded-sm size-[32px]">
              <Gavel size={16} strokeWidth={2} className="text-white" />
            </div>
            <span className="font-extrabold text-[18px] text-white tracking-[-0.3px]">
              Bid<span className="text-primary">Vault</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-semibold text-[13px] text-[rgba(255,255,255,0.65)] hover:text-white">Log In</Link>
            <Link to="/register" className="bg-primary font-bold text-[12px] text-white px-4 py-2 rounded-sm hover:bg-primary-dark">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">Legal</p>
          <h1 className="font-extrabold text-[28px] sm:text-[36px] text-navy tracking-[-0.5px] mb-3">Privacy Policy</h1>
          <p className="text-[14px] text-muted">Last updated: May 2026 · Effective for all BidVault users</p>
          <div className="mt-4 bg-bg border border-border-light rounded-md px-4 py-3">
            <p className="text-[13px] text-tertiary leading-[1.6]">
              BidVault ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your personal data. By using BidVault, you agree to this policy.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="font-bold text-[16px] text-navy mb-3">{s.title}</h2>
              <p className="text-[14px] text-tertiary leading-[1.75]">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 bg-navy rounded-md px-5 py-5">
          <p className="font-bold text-[14px] text-white mb-1">Questions about this policy?</p>
          <p className="text-[13px] text-[rgba(255,255,255,0.55)]">
            Contact our privacy team at{' '}
            <a href="mailto:privacy@bidvault.com" className="text-primary font-bold hover:underline">privacy@bidvault.com</a>.
            We respond within 14 business days.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-placeholder">
          <p>© 2026 BidVault · CUST Islamabad, Spring 2026 FYP</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link to="/" className="hover:text-primary">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
