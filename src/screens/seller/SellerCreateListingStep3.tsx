import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListing } from '../../context/ListingContext';
import { mockApi } from '../../services/mockApi';
import type { ComparableListing } from '../../types';
import { ListingStepperHeader, Stepper } from './SellerCreateListingStep1';

export default function SellerCreateListingStep3() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(draft.aiPrediction ?? null);

  useEffect(() => {
    if (prediction) return;
    setLoading(true);
    mockApi.getPricePrediction(draft.category, draft.condition, draft.startingPrice).then(res => {
      setLoading(false);
      if (res.success && res.data) {
        setPrediction(res.data);
        updateDraft({ aiPrediction: res.data });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useAiPrice = () => {
    if (!prediction) return;
    updateDraft({ useAiPrice: true, finalStartingPrice: prediction.predictedPrice });
    navigate('/seller/create-listing/step-4');
  };

  const keepMyPrice = () => {
    updateDraft({ useAiPrice: false, finalStartingPrice: draft.startingPrice });
    navigate('/seller/create-listing/step-4');
  };

  const fmtPKR = (n: number) => `PKR ${n.toLocaleString()}`;
  const sliderPct = prediction
    ? Math.min(100, Math.max(5, Math.round(((prediction.predictedPrice - prediction.rangeLow) / (prediction.rangeHigh - prediction.rangeLow)) * 100)))
    : 70;

  return (
    <div className="min-h-screen bg-white">
      <ListingStepperHeader currentStep={2} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-8">
        <h1 className="font-extrabold text-[19px] sm:text-[22px] text-[#0b1f3a] mb-1">AI Price Suggestion</h1>
        <p className="text-[13px] text-[#6c757d] mb-5 sm:mb-6">Our AI analyzed similar items to suggest the best starting price</p>

        <Stepper current={2} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-10 border-[3px] border-[#d0021b] border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-[14px] text-[#6c757d]">Running XGBoost model on 47 comparable auctions…</p>
          </div>
        ) : prediction ? (
          <div className="flex flex-col md:grid md:grid-cols-[1fr_260px] gap-5 sm:gap-6">
            <div>
              {/* AI result card */}
              <div className="bg-[#0b1f3a] rounded-[16px] p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="size-[8px] rounded-full bg-[#d0021b] inline-block animate-pulse" />
                  <span className="font-bold text-[10px] text-[#ff8a96] tracking-[1px] uppercase">AI Price Prediction · XGBoost</span>
                </div>

                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-extrabold text-[48px] text-white leading-none">{fmtPKR(prediction.predictedPrice)}</span>
                </div>
                <p className="text-[13px] text-[rgba(255,255,255,0.55)] mb-5">
                  Recommended starting price based on {prediction.comparables.length}+ similar auctions
                </p>

                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[rgba(255,255,255,0.45)]">{fmtPKR(prediction.rangeLow)} (Low)</span>
                    <span className="text-[11px] text-[rgba(255,255,255,0.45)]">{fmtPKR(prediction.rangeHigh)} (High)</span>
                  </div>
                  <div className="relative h-[6px] bg-[rgba(255,255,255,0.15)] rounded-full">
                    <div className="absolute left-0 h-full bg-[#d0021b] rounded-full" style={{ width: `${sliderPct}%` }} />
                    <div className="absolute size-[14px] bg-[#d0021b] border-2 border-white rounded-full top-[-4px]" style={{ left: `calc(${sliderPct}% - 7px)` }} />
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.35)] text-center mt-2">
                    Your price {fmtPKR(draft.startingPrice)} is {draft.startingPrice >= prediction.rangeLow && draft.startingPrice <= prediction.rangeHigh ? 'within the optimal range' : 'outside the optimal range'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {prediction.comparables.map((c: ComparableListing, i: number) => (
                    <div key={i} className="bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] rounded-[10px] p-3">
                      <p className="font-medium text-[11px] text-[rgba(255,255,255,0.55)] mb-1">{c.title}</p>
                      <p className="font-bold text-[14px] text-white">{fmtPKR(c.soldPrice)}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-1">Sold</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                <button onClick={keepMyPrice} className="border-2 border-[#d0021b] font-bold text-[13px] sm:text-[14px] text-[#d0021b] py-3 rounded-[10px] hover:bg-[#fff0f2] transition-colors">
                  Keep My Price ({fmtPKR(draft.startingPrice)})
                </button>
                <button onClick={useAiPrice} className="bg-[#d0021b] font-bold text-[13px] sm:text-[14px] text-white py-3 rounded-[10px] hover:bg-[#a80016] transition-colors">
                  Apply AI Price ({fmtPKR(prediction.predictedPrice)})
                </button>
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5 h-fit">
              <h3 className="font-bold text-[15px] text-[#0b1f3a] mb-4">Confidence Score</h3>
              <div className="text-center mb-5">
                <p className="font-extrabold text-[56px] text-[#1a7a4a] leading-none">{prediction.confidence}%</p>
                <p className="text-[12px] text-[#6c757d] mt-1">Model confidence</p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Category match', value: draft.category.split('&')[0].trim(), color: 'text-[#1a7a4a]' },
                  { label: 'Condition factor', value: draft.condition === 'NEW' ? 'New (+12%)' : draft.condition === 'LIKE_NEW' ? 'Like New (0%)' : 'Used (-18%)', color: draft.condition === 'USED' ? 'text-[#d97706]' : 'text-[#1a7a4a]' },
                  { label: 'Market trend', value: 'Stable', color: 'text-[#f59e0b]' },
                  { label: 'Data points', value: `${prediction.comparables.length}+ auctions`, color: '' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between items-center">
                    <span className="text-[12px] text-[#6c757d]">{d.label}</span>
                    <span className={`font-bold text-[12px] ${d.color || 'text-[#343a40]'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#6c757d]">Could not load prediction. <button onClick={keepMyPrice} className="text-[#d0021b] font-bold">Continue with your price</button></p>
          </div>
        )}

        <div className="flex justify-between mt-5 sm:mt-6">
          <button onClick={() => navigate('/seller/create-listing/step-2')} className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-5 sm:px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa]">← Back</button>
        </div>
      </main>
    </div>
  );
}
