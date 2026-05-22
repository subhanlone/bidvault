import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 1-based
}

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                ${isCompleted ? 'bg-[#d0021b] text-white' : ''}
                ${isActive ? 'bg-[#d0021b] text-white' : ''}
                ${!isCompleted && !isActive ? 'bg-[#e5e7eb] text-[#9ca3af]' : ''}
              `}>
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : stepNum}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap
                ${isActive ? 'text-[#d0021b]' : ''}
                ${isCompleted ? 'text-[#374151]' : ''}
                ${!isCompleted && !isActive ? 'text-[#9ca3af]' : ''}
              `}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-2 mb-5 transition-all duration-200 ${stepNum < currentStep ? 'bg-[#d0021b]' : 'bg-[#e5e7eb]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
