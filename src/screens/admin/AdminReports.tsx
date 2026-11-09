import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Menu } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import { Button, ErrorState, NotificationBell } from '../../components/ui';
import { useAdminReports, useResolveReport } from '../../queries/admin';
import { useTabKeys } from '../../hooks/useTabKeys';
import { useToast } from '../../context/toast';
import { REPORT_REASON_LABEL } from '../../utils/reportReasons';
import { dateMedium } from '../../utils/format';
import type { AdminListingReport, ReportStatus } from '../../types/api';

const TABS: readonly ReportStatus[] = ['OPEN', 'ACTIONED', 'DISMISSED'];
const TAB_LABEL: Record<ReportStatus, string> = { OPEN: 'Open', ACTIONED: 'Actioned', DISMISSED: 'Dismissed' };
const TAB_SUBTITLE: Record<ReportStatus, string> = {
  OPEN: 'Listings people reported, oldest first',
  ACTIONED: 'Reports an admin acted on',
  DISMISSED: 'Reports an admin decided needed no action',
};

/**
 * The listing reports queue (G5/F3). An admin reads each OPEN report and marks it actioned or
 * dismissed. Marking it changes nothing about the auction: to remove the listing, open it in the
 * auction monitor and use cancel or takedown there.
 */
export default function AdminReports() {
  const [tab, setTab] = useState<ReportStatus>('OPEN');
  const onTabKeys = useTabKeys(TABS, tab, setTab);
  const reports = useAdminReports(tab);
  const resolve = useResolveReport();
  const { showToast } = useToast();
  const items: AdminListingReport[] = reports.data?.pages.flatMap((p) => p.items) ?? [];

  const decide = (report: AdminListingReport, status: 'ACTIONED' | 'DISMISSED') => {
    resolve.mutate(
      { reportId: report.reportId, status },
      {
        onSuccess: () => showToast({
          type: 'success',
          title: status === 'ACTIONED' ? 'Marked actioned' : 'Report dismissed',
          message: report.auction.title,
        }),
        onError: (err) => showToast({
          type: 'error',
          title: 'Could not update the report',
          message: err instanceof Error ? err.message : 'Try again.',
        }),
      },
    );
  };

  return (
    <AdminLayout active="Reports">
      {({ openMobileMenu }) => (
        <>
          <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={openMobileMenu}
                aria-label="Open navigation menu"
              >
                <Menu size={18} className="text-tertiary" />
              </button>
              <div>
                <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Reports</h1>
                <p className="text-[12px] text-muted">{TAB_SUBTITLE[tab]}</p>
              </div>
            </div>
            <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          </header>

          <div role="tablist" aria-label="Reports" onKeyDown={onTabKeys} className="flex items-center gap-1 px-4 sm:px-6 pt-4 border-b border-border-light bg-surface">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`reports-tab-${t}`}
                aria-selected={tab === t}
                aria-controls="reports-panel"
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer
                  ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'}`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          <div id="reports-panel" role="tabpanel" aria-labelledby={`reports-tab-${tab}`} className="flex-1 overflow-auto p-4 sm:p-6">
            {reports.isPending ? (
              <div className="bg-surface border border-border-light rounded-md p-10 text-center text-[13px] text-muted">Loading…</div>
            ) : reports.isError ? (
              <ErrorState title="Could not load the reports" onRetry={() => { void reports.refetch(); }} retrying={reports.isFetching} />
            ) : items.length === 0 ? (
              <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-16 px-6 text-center">
                <Flag size={44} strokeWidth={1.3} className="text-placeholder mb-4" aria-hidden="true" />
                <h2 className="font-bold text-[17px] text-navy mb-2">
                  {tab === 'OPEN' ? 'No reports waiting' : `No ${TAB_LABEL[tab].toLowerCase()} reports`}
                </h2>
                <p className="text-[13px] text-muted">
                  {tab === 'OPEN' ? 'When someone reports a listing, it appears here.' : 'Decided reports are kept here.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <ul className="bg-surface border border-border-light rounded-md divide-y divide-bg m-0 p-0 list-none">
                  {items.map((r) => (
                    <li key={r.reportId} className="p-4 sm:px-5 flex flex-col sm:flex-row gap-3 sm:items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[13px] text-secondary">
                          <Link to={`/admin/monitor/${r.auction.auctionId}`} className="hover:text-primary hover:underline">{r.auction.title}</Link>
                        </p>
                        <p className="text-[11px] text-placeholder">
                          {r.auction.listingCode} · Seller {r.auction.sellerName}
                          {r.auction.status === 'CANCELLED' ? ' · already removed' : r.auction.status === 'CLOSED' ? ' · ended' : ''}
                        </p>
                        <p className="mt-2 text-[12px]">
                          <span className="font-bold text-error">{REPORT_REASON_LABEL[r.reason]}</span>
                          <span className="text-muted"> · reported by {r.reporterName} on {dateMedium(r.createdAt)}</span>
                        </p>
                        {r.note && <p className="mt-1 text-[13px] text-secondary leading-[20px] whitespace-pre-line">{r.note}</p>}
                        {r.resolvedAt && (
                          <p className="mt-1 text-[11px] text-muted">Decided {dateMedium(r.resolvedAt)}</p>
                        )}
                      </div>
                      {r.status === 'OPEN' && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => decide(r, 'ACTIONED')} disabled={resolve.isPending}>Mark actioned</Button>
                          <Button size="sm" variant="outline" onClick={() => decide(r, 'DISMISSED')} disabled={resolve.isPending}>Dismiss</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {reports.hasNextPage && (
                  <Button variant="outline" size="sm" className="self-center" loading={reports.isFetchingNextPage} onClick={() => { void reports.fetchNextPage(); }}>
                    Show more
                  </Button>
                )}
                {tab === 'OPEN' && (
                  <p className="text-[12px] text-muted">
                    Marking a report does not change the listing. To remove it, open it in the auction monitor and cancel or take it down there.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
