import type { ReportReason } from '../types/api';

/** The four reasons a listing can be reported for (G5), in the words a buyer would use. Shared by
 * the report dialog and the admin Reports screen, so both say the same thing. */
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  PROHIBITED_ITEM: 'Prohibited item',
  MISLEADING: 'Misleading description or photos',
  COUNTERFEIT: 'Counterfeit or replica',
  OTHER: 'Something else',
};
