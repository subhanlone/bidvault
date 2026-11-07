import { Navigate, useParams } from 'react-router-dom';

/** `/buyer/live-bidding/:auctionId` was the address of the auction page before it opened to everyone. */
export default function LegacyAuctionRedirect() {
  const { auctionId } = useParams<{ auctionId: string }>();
  return <Navigate to={auctionId ? `/auctions/${auctionId}` : '/browse'} replace />;
}
