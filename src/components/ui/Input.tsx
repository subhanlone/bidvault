import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-body">
          {label}
          {props.required && <span className="text-primary ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`
            w-full h-10 px-3 rounded-lg border text-sm text-body bg-surface
            placeholder:text-placeholder
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
            disabled:bg-surface-raised disabled:cursor-not-allowed
            ${error ? 'border-error focus:border-error focus-visible:ring-error' : 'border-border focus:border-primary focus-visible:ring-primary'}
            ${leftIcon ? 'pl-9' : ''}
            ${rightIcon ? 'pr-9' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p id={`${inputId}-error`} role="alert" className="text-[12px] text-primary">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-[12px] text-muted">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
