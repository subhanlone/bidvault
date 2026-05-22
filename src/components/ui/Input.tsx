import { type InputHTMLAttributes, forwardRef } from 'react';

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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-[#374151]">
          {label}
          {props.required && <span className="text-[#d0021b] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 px-3 rounded-lg border text-sm text-[#374151] bg-white
            placeholder:text-[#9ca3af]
            transition-all duration-200
            focus:outline-none focus:border-[#d0021b] focus:ring-3 focus:ring-[rgba(208,2,27,0.1)]
            disabled:bg-[#f9fafb] disabled:cursor-not-allowed
            ${error ? 'border-[#d0021b]' : 'border-[#e5e7eb]'}
            ${leftIcon ? 'pl-9' : ''}
            ${rightIcon ? 'pr-9' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d]">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-[12px] text-[#d0021b]">{error}</p>}
      {hint && !error && <p className="text-[12px] text-[#6c757d]">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
