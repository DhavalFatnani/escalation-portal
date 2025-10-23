import React from 'react';
import { Check, Minus } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  onClick,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    if (!disabled) {
      onChange();
    }
  };

  const checkboxClasses = [
    'custom-checkbox',
    checked && !indeterminate ? 'checked' : '',
    indeterminate ? 'indeterminate' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={checkboxClasses}
      onClick={handleClick}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!disabled) {
            onChange();
          }
        }
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}} // Handled by parent div
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="checkmark">
        {indeterminate ? (
          <Minus className="w-3 h-3" />
        ) : (
          <Check className="w-3 h-3" />
        )}
      </div>
    </div>
  );
};

export default CustomCheckbox;
