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
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                aria-current={isActive ? 'step' : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                  ${isActive ? 'bg-primary text-white' : ''}
                  ${isCompleted ? 'bg-success-bg text-success border border-success-border' : ''}
                  ${!isCompleted && !isActive ? 'bg-surface-raised text-placeholder border border-border' : ''}
                `}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : stepNum}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap
                ${isActive ? 'text-primary' : ''}
                ${isCompleted ? 'text-body' : ''}
                ${!isCompleted && !isActive ? 'text-placeholder' : ''}
              `}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-2 mb-5 transition-all duration-200 ${stepNum < currentStep ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
