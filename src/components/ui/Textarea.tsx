import { type TextareaHTMLAttributes, forwardRef } from 'react';

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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-[#374151]">
          {label}
          {props.required && <span className="text-[#d0021b] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`
          w-full px-3 py-2.5 rounded-lg border text-sm text-[#374151] bg-white
          placeholder:text-[#9ca3af] resize-none
          transition-all duration-200
          focus:outline-none focus:border-[#d0021b] focus:ring-3 focus:ring-[rgba(208,2,27,0.1)]
          disabled:bg-[#f9fafb] disabled:cursor-not-allowed
          ${error ? 'border-[#d0021b]' : 'border-[#e5e7eb]'}
          ${className}
        `}
        rows={4}
        {...props}
      />
      {error && <p role="alert" className="text-[12px] text-[#d0021b]">{error}</p>}
      {hint && !error && <p className="text-[12px] text-[#6c757d]">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
