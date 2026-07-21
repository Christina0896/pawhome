import { ArrowIcon } from '../../../components/Icons';

export default function CustomSelect({
  id,
  label,
  required = false,
  value,
  placeholder,
  options,
  error,
  openDropdown,
  setOpenDropdown,
  onChange,
}) {
  const open = openDropdown === id;
  const hasLabelArea = label !== '' || required || error;
  const listboxId = `${id}-options`;

  const chooseOption = (optionValue) => {
    onChange(optionValue);
    setOpenDropdown(null);
  };

  return (
    <div className="relative w-full data-dropdown-root">
      {hasLabelArea && (
        <div className="min-h-[38px]">
          <label id={`${id}-label`} className="block text-sm font-semibold text-(--secondary-green)">
            {label} {required && <span className="text-(--primary-orange)">*</span>}
          </label>
          <p className="min-h-[16px] text-xs text-red-500">{error || ''}</p>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={hasLabelArea ? `${id}-label` : undefined}
        onClick={() => setOpenDropdown(open ? null : id)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpenDropdown(id);
          }
          if (event.key === 'Escape') setOpenDropdown(null);
        }}
        className={`flex h-[45px] w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm outline-none ring-0 transition focus:outline-none focus:ring-0 ${error ? 'border-red-400' : open ? 'border-(--primary-green)' : 'border-(--border-beige) hover:border-(--primary-green)'}`}
      >
        <span className={`block truncate ${value ? 'text-(--secondary-green)' : 'text-(--muted-green-text)'}`}>
          {value || placeholder}
        </span>
        <ArrowIcon className={`ml-3 h-3.5 w-3.5 shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={hasLabelArea ? `${id}-label` : undefined}
          className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => chooseOption(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpenDropdown(null);
                }
              }}
              className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm text-(--secondary-green) outline-none transition hover:bg-(--background) focus:bg-(--background) focus:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
