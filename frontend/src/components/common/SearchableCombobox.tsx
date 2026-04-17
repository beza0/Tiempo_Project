import * as React from "react";
import { ChevronsUpDown, Search } from "lucide-react";

import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type ComboboxOption = { value: string; label: string };

type SearchableComboboxProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  className?: string;
  "aria-labelledby"?: string;
};

function filterOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const t = query.trim().toLowerCase();
  if (!t) return options;
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t),
  );
}

export function SearchableCombobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
  "aria-labelledby": ariaLabelledBy,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const labelMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const o of options) {
      m.set(o.value, o.label);
    }
    return m;
  }, [options]);

  const filtered = React.useMemo(
    () => filterOptions(options, query),
    [options, query],
  );

  const display = value.trim()
    ? labelMap.get(value) ?? value
    : "";

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const raf = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-labelledby={ariaLabelledBy}
          disabled={disabled}
          className={cn(
            "h-auto min-h-9 w-full justify-between font-normal text-left py-2",
            !display && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{display || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="searchable-combobox-panel z-[200] flex w-[var(--radix-popover-trigger-width)] min-w-[280px] flex-col p-0"
        align="start"
        sideOffset={4}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="searchable-combobox-search flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="searchable-combobox-search-field flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <Search
              className="h-5 w-5 shrink-0 opacity-50"
              aria-hidden
            />
            <Input
              ref={searchInputRef}
              type="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered.length === 1) pick(filtered[0].value);
                }
              }}
              className="h-12 min-h-12 border-0 bg-transparent py-3 text-base shadow-none focus-visible:ring-0 md:text-base"
            />
          </div>

          <div
            className="searchable-combobox-list min-h-0 flex-1 p-1"
            role="listbox"
            aria-label={searchPlaceholder}
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5 p-0">
                {filtered.map((opt) => (
                  <li key={`${opt.value}-${opt.label}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === opt.value}
                      className={cn(
                        "flex w-full cursor-pointer rounded-sm px-3 py-2.5 text-left text-sm outline-none transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:bg-accent focus-visible:text-accent-foreground",
                        value === opt.value && "bg-accent/60",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
