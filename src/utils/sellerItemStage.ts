import type { ListingCategory, ListingDraft } from '../types';
import type { SellerItem, SellerItemAction, SellerItemTab } from '../types/api';
import { conditionLabel, count, dateMedium, dateTimeShort, pkr, timeAgo, timeLeft } from './format';

/**
 * How a seller's item reads on the My Items screen.
 *
 * The server decides what stage an item is in, which tab it belongs to and which actions are
 * allowed (backend modules/seller-items/seller-item-stage.ts). This file only decides how those
 * answers are worded and drawn: the copy for each stage, its position on the six-step journey bar,
 * the two figures shown beside it, and the order action buttons appear in. It never works a rule
 * out again from the item's raw fields.
 */

export const TAB_ORDER: SellerItemTab[] = ['action', 'review', 'live', 'sold', 'unsold', 'closed'];

export const TAB_LABELS: Record<SellerItemTab, string> = {
  action: 'Needs action',
  review: 'Under review',
  live: 'Live',
  sold: 'Sold',
  unsold: 'Unsold',
  closed: 'Rejected / Removed',
};

export function isSellerItemTab(value: string | null): value is SellerItemTab {
  return TAB_ORDER.some((t) => t === value);
}

/** What each empty tab says. */
export const EMPTY_TAB: Record<SellerItemTab, { heading: string; sub: string }> = {
  action: { heading: 'Nothing needs you right now', sub: 'Items to ship, disputes to answer and unpaid sales will show up here.' },
  review: { heading: 'No items under review', sub: 'Items you submit wait here until an admin approves them.' },
  live: { heading: 'No live auctions', sub: 'Approved items appear here while their auction is running.' },
  sold: { heading: 'Nothing sold yet', sub: 'Once an auction ends with a winner, the sale is tracked here until it is delivered.' },
  unsold: { heading: 'No unsold items', sub: 'Auctions that ended without a sale, or were cancelled, are listed here.' },
  closed: { heading: 'Nothing rejected or removed', sub: 'Items an admin rejected or took down appear here with the reason.' },
};

export type Tone = 'primary' | 'warn' | 'err' | 'info' | 'ok';
export type BadgeVariant = 'tag' | 'success' | 'warning' | 'error' | 'info';

/** The six steps of an item's life, left to right. */
export const JOURNEY_STEPS = ['Review', 'Live', 'Sold', 'Paid', 'Shipped', 'Delivered'] as const;

export interface Journey {
  /** How many steps are behind it. */
  done: number;
  /** The step it is on now, or null when it is not moving (or it has finished). */
  current: number | null;
  complete: boolean;
}

export interface StageView {
  /** The headline under the journey bar. */
  label: string;
  /** One line of context under it. */
  caption: string;
  tone: Tone;
  journey: Journey;
  badge: { label: string; variant: BadgeVariant };
  /** The two figures shown beside the stage. */
  facts: [Fact, Fact];
}

export interface Fact {
  label: string;
  value: string;
}

const fact = (label: string, value: string): Fact => ({ label, value });

export function stageView(item: SellerItem, now: number): StageView {
  const { auction, sale, listing } = item;
  const buyer = sale?.buyerName ?? 'the buyer';
  const soldFor = fact('Sold for', pkr(sale?.finalAmount ?? 0));
  const buyerFact = fact('Buyer', sale?.buyerName ?? '—');
  const bidCount = auction?.bidCount ?? 0;

  const view = (
    label: string,
    caption: string,
    tone: Tone,
    done: number,
    current: number | null,
    badge: StageView['badge'],
    facts: [Fact, Fact],
    complete = false,
  ): StageView => ({ label, caption, tone, journey: { done, current, complete }, badge, facts });

  switch (item.stage) {
    case 'UNDER_REVIEW':
      return view('Under review', `Submitted ${timeAgo(listing.submittedAt, now)}`, 'info', 0, 0,
        { label: 'Pending', variant: 'info' },
        [fact('Start price', pkr(listing.startPrice)), fact('Duration', `${listing.durationDays} days`)]);
    case 'REJECTED':
      return view('Rejected', listing.rejectionReason ?? 'An admin rejected this item.', 'err', 0, 0,
        { label: 'Rejected', variant: 'error' },
        [fact('Submitted', dateMedium(listing.submittedAt)), fact('Start price', pkr(listing.startPrice))]);
    case 'REMOVED':
      return view('Removed by admin', listing.rejectionReason ?? 'An admin took this item down.', 'err', 0, 0,
        { label: 'Removed', variant: 'error' },
        [fact('Submitted', dateMedium(listing.submittedAt)), fact('Start price', pkr(listing.startPrice))]);
    case 'LIVE': {
      const reserve = listing.reservePrice;
      const badge: StageView['badge'] =
        reserve === undefined
          ? { label: 'No reserve', variant: 'tag' }
          : bidCount > 0 && (auction?.currentBid ?? 0) >= reserve
            ? { label: 'Reserve met', variant: 'success' }
            : { label: 'Reserve not met', variant: 'warning' };
      return view(auction ? `Ends in ${timeLeft(auction.endTime, now)}` : 'Live', auction ? dateTimeShort(auction.endTime) : '', 'primary', 1, 1, badge, [
        bidCount > 0 ? fact('Current bid', pkr(auction?.currentBid ?? 0)) : fact('Start price', pkr(listing.startPrice)),
        fact('Bids · watching', `${bidCount === 0 ? 'No bids' : count(bidCount, 'bid')} · ${auction?.watcherCount ?? 0} watching`),
      ]);
    }
    case 'AWAITING_PAYMENT':
      return view('Awaiting payment', `Waiting on ${buyer}`, 'info', 3, 3,
        { label: 'Waiting on buyer', variant: 'info' }, [soldFor, buyerFact]);
    case 'NEEDS_SHIPPING':
      return view('Ship this item', sale?.paidAt ? `Payment received ${timeAgo(sale.paidAt, now)}` : 'Payment received', 'primary', 4, 4,
        { label: 'Ready to ship', variant: 'warning' }, [soldFor, buyerFact]);
    case 'SHIPPED':
      return view('Shipped', sale?.reviewDeadlineAt
        ? `Payout releases by ${dateMedium(sale.reviewDeadlineAt)} unless the buyer responds sooner`
        : 'On its way to the buyer', 'info', 5, 5,
        { label: 'Shipped', variant: 'info' }, [soldFor, buyerFact]);
    case 'DELIVERED':
      return view('Delivered, payout released', sale?.payoutAt ? `Completed ${dateMedium(sale.payoutAt)}` : 'Completed', 'ok', 6, null,
        { label: 'Complete', variant: 'success' },
        [soldFor, sale?.reviewStars ? fact('Rating', `${sale.reviewStars} / 5`) : fact('Payout', sale?.payoutAt ? dateMedium(sale.payoutAt) : 'Released')],
        true);
    case 'DISPUTE_AWAITING_RESPONSE':
      return view('Buyer opened a dispute', sale?.disputeReason ?? 'The buyer reported a problem.', 'err', 5, 5,
        { label: 'Dispute open', variant: 'error' },
        [fact('Sale', pkr(sale?.finalAmount ?? 0)),
          fact('Respond by', sale?.disputeResponseDueAt ? dateMedium(sale.disputeResponseDueAt) : '—')]);
    case 'DISPUTED':
      return view('Dispute with the admin', sale?.disputeSellerRespondedAt
        ? `You responded ${dateMedium(sale.disputeSellerRespondedAt)}; an admin will decide`
        : 'An admin will decide', 'warn', 5, 5,
        { label: 'With admin', variant: 'info' }, [fact('Sale', pkr(sale?.finalAmount ?? 0)), buyerFact]);
    case 'REFUNDED':
      return view('Refunded to the buyer', 'No payout for this sale.', 'info', 4, null,
        { label: 'Refunded', variant: 'tag' }, [fact('Sale', pkr(sale?.finalAmount ?? 0)), buyerFact]);
    case 'PAYMENT_DEFAULTED':
      return view("Buyer didn't pay", 'The payment window closed without a payment.', 'err', 3, 3,
        { label: 'Unpaid', variant: 'error' },
        [fact('Winning bid', pkr(sale?.finalAmount ?? 0)),
          fact('Next bidder offer', sale?.nextBidderOffer != null ? pkr(sale.nextBidderOffer) : 'No other bidder')]);
    case 'RELISTED':
      return view('Relisted', item.relistedAs ? `Live again as ${item.relistedAs.listingCode}` : 'Live again as a new listing', 'info', 3, null,
        { label: 'Relisted', variant: 'info' }, [fact('Winning bid', pkr(sale?.finalAmount ?? 0)), fact('Payment', 'Not received')]);
    case 'ENDED_RESERVE_NOT_MET':
      return view('Ended, reserve not met',
        `Top bid ${pkr(auction?.currentBid ?? 0)}${listing.reservePrice !== undefined ? `, reserve ${pkr(listing.reservePrice)}` : ''}`, 'warn', 2, 2,
        { label: 'Not sold', variant: 'warning' }, [fact('Top bid', pkr(auction?.currentBid ?? 0)), fact('Bids', String(bidCount))]);
    case 'ENDED_NO_BIDS':
      return view('Ended with no bids', auction ? `Ended ${dateMedium(auction.endTime)}` : '', 'warn', 2, 2,
        { label: 'Not sold', variant: 'warning' }, [fact('Start price', pkr(listing.startPrice)), fact('Bids', '0')]);
    case 'CANCELLED':
      // Not dated: cancelling leaves the scheduled end where it was, so endTime would be a date
      // in the future for an auction that has already stopped. The server does not record when.
      return view('Auction cancelled', 'Stopped before its scheduled end', 'info', 1, null,
        { label: 'Cancelled', variant: 'tag' }, [fact('Start price', pkr(listing.startPrice)), fact('Bids', String(bidCount))]);
  }
}

// ---- actions --------------------------------------------------------------------------------

/**
 * Wording and weight of each action. The key order is the priority order on a row: the first
 * action an item has is its main button, drawn filled when `filled` is set; the second sits beside
 * it as an outline. (The server lists RELIST before OFFER_NEXT_BIDDER; offering the sale to the
 * next bidder recovers it at a known price, so it leads here.)
 */
export const ACTION_META: Record<SellerItemAction, { label: string; filled: boolean }> = {
  MARK_SHIPPED: { label: 'Mark as shipped', filled: true },
  RESPOND_TO_DISPUTE: { label: 'Respond to dispute', filled: true },
  OFFER_NEXT_BIDDER: { label: 'Offer to next bidder', filled: true },
  EDIT_RESUBMIT: { label: 'Edit & resubmit', filled: true },
  LIST_AGAIN: { label: 'List again', filled: true },
  RELIST: { label: 'Relist', filled: false },
  CANCEL_AUCTION: { label: 'Cancel auction', filled: false },
  WITHDRAW: { label: 'Withdraw', filled: false },
  VIEW_INVOICE: { label: 'View invoice', filled: false },
};

const ACTION_PRIORITY = Object.keys(ACTION_META) as SellerItemAction[];

/** The item's allowed actions, main button first. */
export function orderedActions(actions: SellerItemAction[]): SellerItemAction[] {
  return [...actions].sort((a, b) => ACTION_PRIORITY.indexOf(a) - ACTION_PRIORITY.indexOf(b));
}

/**
 * "List again": the create-listing form, filled in from an item that ended without a sale. It goes
 * through review like any new listing; nothing about the old one is reused except what was typed.
 */
export function listAgainDraft(item: SellerItem): ListingDraft {
  const { listing } = item;
  return {
    title: item.title,
    // The server only ever stores a category it validated against this same list.
    category: item.category as ListingCategory,
    condition: item.condition,
    description: listing.description,
    imageUrl: item.imageUrl ?? '',
    duration: listing.durationDays,
    startingPrice: listing.startPrice,
    minIncrement: listing.minIncrement,
    hasReserve: listing.reservePrice !== undefined,
    reservePrice: listing.reservePrice ?? 0,
    attributes: listing.attributes ?? {},
  };
}

// ---- details panel --------------------------------------------------------------------------

/** The "Details" list in the expanded row. */
export function detailFacts(item: SellerItem): Fact[] {
  const { listing, auction, sale } = item;
  const facts: Fact[] = [
    fact('Category', item.category),
    fact('Condition', conditionLabel(item.condition)),
    fact('Start price', pkr(listing.startPrice)),
    fact('Reserve', listing.reservePrice !== undefined ? pkr(listing.reservePrice) : 'None'),
    fact('Min. increment', pkr(listing.minIncrement)),
    fact('Duration', `${listing.durationDays} days`),
  ];
  if (auction) {
    facts.push(fact('Bids', String(auction.bidCount)), fact('Watching', String(auction.watcherCount)));
  }
  if (sale) {
    facts.push(fact('Buyer', sale.buyerName));
    if (sale.deliveryAddress) {
      facts.push(fact('Ship to', sale.deliveryPhone ? `${sale.deliveryAddress} · ${sale.deliveryPhone}` : sale.deliveryAddress));
    }
  }
  return facts;
}

export interface TimelineEvent {
  text: string;
  /** ISO time, when the platform recorded one. */
  at?: string;
}

/**
 * What has happened to the item, newest first. Only events the platform actually recorded with a
 * time are dated; a rejection or removal has its reason but no stored time, so it leads undated.
 */
export function timeline(item: SellerItem): TimelineEvent[] {
  const { listing, auction, sale } = item;
  const events: TimelineEvent[] = [{ text: 'Submitted for review', at: listing.submittedAt }];

  if (item.stage === 'REJECTED') events.push({ text: `Rejected${listing.rejectionReason ? `: ${listing.rejectionReason}` : ''}` });
  if (item.stage === 'REMOVED') events.push({ text: `Removed${listing.rejectionReason ? `: ${listing.rejectionReason}` : ''}` });

  if (auction) {
    events.push({ text: 'Listing went live', at: auction.startTime });
    // Undated, for the reason given at the CANCELLED view above.
    if (auction.status === 'CANCELLED') events.push({ text: 'Auction cancelled' });
    if (auction.status === 'CLOSED') {
      events.push({
        text: auction.reserveMet === false ? 'Auction ended, reserve not met' : 'Auction ended',
        at: auction.endTime,
      });
    }
  }
  if (sale?.paidAt) events.push({ text: 'Payment received', at: sale.paidAt });
  if (sale?.shippedAt) events.push({ text: 'Shipped', at: sale.shippedAt });
  if (sale?.disputeSellerRespondedAt) events.push({ text: 'You responded to the dispute', at: sale.disputeSellerRespondedAt });
  if (sale?.payoutAt) events.push({ text: 'Payout released', at: sale.payoutAt });

  return events.sort((a, b) => {
    if (!a.at || !b.at) return a.at ? 1 : b.at ? -1 : 0;
    return new Date(b.at).getTime() - new Date(a.at).getTime();
  });
}
