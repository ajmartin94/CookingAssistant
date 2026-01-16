import { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-white rounded-lg shadow-soft-lg border border-neutral-200 py-1 z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => {
            const baseClasses =
              'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors';
            const stateClasses = item.disabled
              ? 'text-neutral-400 cursor-not-allowed'
              : item.danger
              ? 'text-error-600 hover:bg-error-50'
              : 'text-neutral-700 hover:bg-neutral-50';

            if (item.href && !item.disabled) {
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`${baseClasses} ${stateClasses}`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </a>
              );
            }

            return (
              <button
                key={index}
                type="button"
                className={`${baseClasses} ${stateClasses}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
