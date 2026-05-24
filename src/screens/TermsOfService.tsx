import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account or using BidVault in any way, you agree to these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users — Buyers, Sellers, and Administrators — and govern all interactions on BidVault.`,
  },
  {
    title: '2. Account Registration',
    body: `You must provide accurate, complete information when registering. You are responsible for maintaining the confidentiality of your password and for all activities under your account. BidVault reserves the right to suspend or terminate accounts that provide false information, engage in fraudulent activity, or violate these terms.`,
  },
  {
    title: '3. Buyer Responsibilities',
    body: `Placing a bid is a binding commitment to purchase if you win. Buyers must not place bids they do not intend to honor. BidVault is not responsible for the quality, condition, or accuracy of item descriptions — buyers are encouraged to review listing details carefully before bidding. Payment and delivery arrangements are made directly between winning buyers and verified sellers.`,
  },
  {
    title: '4. Seller Responsibilities',
    body: `Sellers must maintain accurate account information and may be subject to admin review before listing privileges are granted. All listings must accurately describe the item, including its condition. Sellers may not list prohibited items (counterfeit goods, stolen property, weapons, restricted items). Sellers are responsible for honoring transactions when a listing receives winning bids. BidVault may remove listings and ban sellers who violate these rules.`,
  },
  {
    title: '5. Admin Review and Approval',
    body: `All seller listings are subject to admin review before going live. BidVault administrators may approve, reject, or request additional information for any listing. Approval decisions are final. Rejected listings may be resubmitted after addressing the stated concerns.`,
  },
  {
    title: '6. Prohibited Conduct',
    body: `Users may not engage in bid manipulation, shill bidding (artificially inflating prices through coordinated or fake bids), scraping or automated access to the platform, impersonating other users, or using BidVault for money laundering or any illegal activity. Violations may result in immediate permanent account termination and referral to relevant authorities.`,
  },
  {
    title: '7. Intellectual Property',
    body: `BidVault's name, logo, design, and platform code are the intellectual property of the BidVault development team and CUST Islamabad. You may not reproduce or distribute any part of the platform without prior written permission. Content you upload (photos, descriptions) remains yours; by uploading, you grant BidVault a non-exclusive license to display it on the platform.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `BidVault provides the platform "as-is" and makes no guarantees about uptime, accuracy of listing data, or outcomes of transactions. To the maximum extent permitted by law, BidVault is not liable for any indirect, incidental, or consequential damages arising from use of the platform, including losses from disputed transactions or auction results.`,
  },
  {
    title: '9. Dispute Resolution',
    body: `Disputes between buyers and sellers are to be resolved between the parties. BidVault may, at its discretion, provide dispute mediation but is not obligated to do so. All disputes related to these terms are subject to the laws of Pakistan and the jurisdiction of courts in Islamabad.`,
  },
  {
    title: '10. Changes to Terms',
    body: `BidVault may update these terms at any time. Material changes will be communicated via email and a platform notice at least 7 days before taking effect. Continued use of BidVault after the effective date constitutes acceptance.`,
  },
];

export default function TermsOfService() {
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
          <h1 className="font-extrabold text-[28px] sm:text-[36px] text-navy tracking-[-0.5px] mb-3">Terms of Service</h1>
          <p className="text-[14px] text-muted">Last updated: May 2026 · Effective for all BidVault users</p>
          <div className="mt-4 bg-primary-surface border border-[rgba(208,2,27,0.2)] rounded-md px-4 py-3">
            <p className="text-[13px] text-secondary leading-[1.6]">
              <span className="font-bold">Please read these terms carefully.</span> By registering an account or using BidVault, you enter into a binding agreement with these Terms of Service. These terms define your rights and obligations as a platform user.
            </p>
          </div>
        </div>

        {/* Quick nav */}
        <div className="mb-8 bg-bg border border-border-light rounded-md p-4">
          <p className="font-bold text-[12px] text-muted uppercase tracking-[0.5px] mb-3">Jump to Section</p>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => {
              const anchor = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <button
                  key={s.title}
                  onClick={() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="font-medium text-[11px] text-tertiary bg-surface border border-border-light px-2.5 py-1 rounded-[6px] hover:border-primary hover:text-primary transition-colors"
                >
                  {s.title.split('. ')[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map(s => {
            const anchor = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div key={s.title} id={anchor}>
                <h2 className="font-bold text-[16px] text-navy mb-3">{s.title}</h2>
                <p className="text-[14px] text-tertiary leading-[1.75]">{s.body}</p>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-10 bg-navy rounded-md px-5 py-5">
          <p className="font-bold text-[14px] text-white mb-1">Questions about these terms?</p>
          <p className="text-[13px] text-[rgba(255,255,255,0.55)]">
            Contact us at{' '}
            <a href="mailto:legal@bidvault.com" className="text-primary font-bold hover:underline">legal@bidvault.com</a>.
            For urgent matters, use the support form on the platform.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-placeholder">
          <p>© 2026 BidVault · CUST Islamabad, Spring 2026 FYP</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/" className="hover:text-primary">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
