import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "./utils";

import "react-day-picker/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** v9 table layout; merge with getDefaultClassNames so `rdp-disabled` / modifier classes stay on the DOM. */
function Calendar({ className, classNames: userClassNames, components, ...props }: CalendarProps) {
  const { root: rootOverride, ...restUserClassNames } = userClassNames ?? {};
  const dz = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays
      className={cn(
        "timelink-calendar p-2 [--rdp-day-width:2.25rem] [--rdp-day-height:2.25rem] [--rdp-day_button-width:2.25rem] [--rdp-day_button-height:2.25rem]",
        className,
      )}
      classNames={{
        ...dz,
        root: cn(
          dz.root,
          "w-full min-w-[18rem] max-w-[20rem] rounded-xl border border-border bg-card/80 p-2 shadow-sm",
          rootOverride,
        ),
        months: cn(
          dz.months,
          "relative !max-w-none w-full min-w-[18rem] flex flex-col gap-4",
        ),
        month: cn(dz.month, "w-full min-w-[18rem] space-y-2"),
        month_caption: cn(
          dz.month_caption,
          "relative mb-1 flex h-10 w-full items-center justify-center px-11 pointer-events-none",
        ),
        caption_label: cn(
          dz.caption_label,
          "text-center text-sm font-semibold text-foreground whitespace-nowrap",
        ),
        nav: cn(
          dz.nav,
          "absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between px-0.5 pointer-events-auto",
        ),
        button_previous: cn(
          dz.button_previous,
          "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent",
        ),
        button_next: cn(
          dz.button_next,
          "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent",
        ),
        month_grid: cn(dz.month_grid, "w-full min-w-[16.5rem] border-collapse table-fixed"),
        weekdays: cn(dz.weekdays, "border-b border-border/60"),
        weekday: cn(
          dz.weekday,
          "w-[14.28%] p-1.5 text-center text-[0.75rem] font-medium text-muted-foreground",
        ),
        weeks: dz.weeks,
        week: cn(dz.week, "border-0"),
        day: cn(dz.day, "p-0 text-center align-middle"),
        day_button: cn(
          dz.day_button,
          "mx-auto inline-flex size-9 max-w-full min-w-0 items-center justify-center rounded-md p-0 font-normal",
          "text-foreground hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100",
        ),
        selected: cn(
          dz.selected,
          "rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:bg-primary",
        ),
        today: cn(dz.today, "bg-accent text-accent-foreground"),
        outside: cn(
          dz.outside,
          "text-muted-foreground/40 aria-selected:text-muted-foreground",
        ),
        disabled: cn(dz.disabled, "cursor-not-allowed"),
        hidden: cn(dz.hidden, "invisible"),
        ...restUserClassNames,
      }}
      components={{
        Chevron: ({ className: chClass, orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chClass)} {...rest} />
          ) : (
            <ChevronRight className={cn("size-4", chClass)} {...rest} />
          ),
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
