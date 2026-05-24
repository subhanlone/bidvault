import { type TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
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
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`
          w-full px-3 py-2.5 rounded-lg border text-sm text-body bg-surface
          placeholder:text-placeholder resize-none
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
          disabled:bg-surface-raised disabled:cursor-not-allowed
          ${error ? 'border-error focus:border-error focus-visible:ring-error' : 'border-border focus:border-primary focus-visible:ring-primary'}
          ${className}
        `}
        rows={4}
        {...props}
      />
      {error && <p id={`${inputId}-error`} role="alert" className="text-[12px] text-primary">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-[12px] text-muted">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
