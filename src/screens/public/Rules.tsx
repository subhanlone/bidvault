import { Link } from 'react-router-dom';
import { SiteNavbar } from '../../components/ui';

/**
 * "What you may not sell" (guest browsing F3, decision J). Public, linked from the home footer, the
 * Report dialog and the first step of creating a listing. The wording is policy: the user approves
 * it before it ships.
 */
const NOT_ALLOWED: { title: string; body: string }[] = [
  {
    title: 'Anything illegal to sell in Pakistan',
    body: 'Including drugs and anything made for using them, and goods that may not be imported, owned or sold here.',
  },
  {
    title: 'Weapons',
    body: 'Firearms, ammunition, their parts, explosives and fireworks, and replica guns that look real.',
  },
  {
    title: 'Stolen goods',
    body: 'Anything you do not own or have no right to sell.',
  },
  {
    title: 'Counterfeits and copies',
    body: 'Fakes and replicas sold as the real brand, and unlicensed copies of software, films, music or games.',
  },
  {
    title: 'Medicines and medical devices',
    body: 'Prescription medicines, and medical devices that need a licence to sell.',
  },
  {
    title: 'Dangerous materials',
    body: 'Flammable, toxic or corrosive chemicals, gas cylinders, and anything else unsafe to post or hand over.',
  },
  {
    title: 'Animals and wildlife',
    body: 'Live animals, and protected wildlife or parts of it (ivory, skins, shells).',
  },
  {
    title: 'Documents, money and accounts',
    body: 'Identity cards, passports, licences and other official documents; currency; personal information; and accounts or SIM cards registered to someone.',
  },
  {
    title: 'Adult content',
    body: 'Sexual material of any kind.',
  },
  {
    title: 'Things that are not a physical item',
    body: 'BidVault auctions physical items. Services, tickets, gift cards, vouchers and digital downloads are not sold here.',
  },
];

const HONEST: string[] = [
  'Photos are of the item you are selling, not pictures taken from elsewhere.',
  'The condition is stated honestly, and any fault or missing part is in the description.',
  'The title and the category describe the item itself.',
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteNavbar />
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <header>
          <h1 className="font-extrabold text-[24px] text-navy mb-2">What you may not sell</h1>
          <p className="text-[14px] text-secondary leading-[22px]">
            An admin checks every listing before it goes live. These items are not allowed on BidVault. If you see one,
            use <span className="font-semibold">Report this listing</span> on its page.
          </p>
        </header>

        <section aria-labelledby="not-allowed" className="bg-surface border border-border-light rounded-md p-5 sm:p-6">
          <h2 id="not-allowed" className="font-bold text-[16px] text-navy mb-4">Not allowed</h2>
          <ul className="flex flex-col gap-4 m-0 p-0 list-none">
            {NOT_ALLOWED.map((item) => (
              <li key={item.title}>
                <h3 className="font-semibold text-[14px] text-secondary">{item.title}</h3>
                <p className="text-[13px] text-muted leading-[20px]">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="honest" className="bg-surface border border-border-light rounded-md p-5 sm:p-6">
          <h2 id="honest" className="font-bold text-[16px] text-navy mb-3">Every listing must be honest</h2>
          <ul className="flex flex-col gap-2 m-0 pl-5 list-disc text-[13px] text-secondary leading-[20px]">
            {HONEST.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section aria-labelledby="what-happens" className="bg-surface border border-border-light rounded-md p-5 sm:p-6">
          <h2 id="what-happens" className="font-bold text-[16px] text-navy mb-3">What happens to a listing that breaks these rules</h2>
          <p className="text-[13px] text-secondary leading-[20px]">
            An admin rejects it before it goes live, or takes it down if it is already running. A buyer who has paid for an
            item that was taken down before it shipped is refunded. An account that keeps breaking these rules can be
            suspended.
          </p>
        </section>

        <p className="text-[12px] text-muted">
          This list is not complete. When in doubt, do not list the item. See also the{' '}
          <Link to="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link>.
        </p>
      </main>
    </div>
  );
}
