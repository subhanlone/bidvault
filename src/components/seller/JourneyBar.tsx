import { JOURNEY_STEPS, type Journey, type Tone } from '../../utils/sellerItemStage';

const CURRENT_STEP: Record<Tone, string> = {
  primary: 'bg-primary',
  warn: 'bg-warning',
  err: 'bg-error',
  info: 'bg-info',
  ok: 'bg-success',
};

/** Where an item is on the six steps of its life: Review, Live, Sold, Paid, Shipped, Delivered. */
export default function JourneyBar({ journey, tone }: { journey: Journey; tone: Tone }) {
  const label = journey.complete
    ? `All ${JOURNEY_STEPS.length} steps complete`
    : `${journey.done} of ${JOURNEY_STEPS.length} steps done${journey.current !== null ? `, now at ${JOURNEY_STEPS[journey.current]}` : ''}`;

  return (
    <div className="flex gap-[3px]" role="img" aria-label={label}>
      {JOURNEY_STEPS.map((step, i) => {
        const colour = journey.complete
          ? 'bg-success'
          : i < journey.done
            ? 'bg-navy'
            : i === journey.current
              ? CURRENT_STEP[tone]
              : 'bg-border';
        return <span key={step} className={`h-[5px] flex-1 rounded-[3px] ${colour}`} />;
      })}
    </div>
  );
}
