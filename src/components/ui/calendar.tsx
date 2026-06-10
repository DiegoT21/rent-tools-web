import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "flex flex-col gap-4",
    month: "space-y-4",
    month_caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium text-slate-900",
    nav: "space-x-1 flex items-center",
    button_previous: cn(
      buttonVariants({ variant: "outline" }),
      "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute left-1"
    ),
    button_next: cn(
      buttonVariants({ variant: "outline" }),
      "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute right-1"
    ),
    month_grid: "w-full border-collapse",
    weekdays: "flex",
    weekday: "w-9 text-[0.8rem] font-normal text-slate-500 grid place-items-center",
    weeks: "flex flex-col",
    week: "flex w-full mt-2",
    day: "relative p-0 text-center text-sm",
    day_button: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 rounded-md p-0 font-normal transition-colors hover:bg-orange-100",
      "aria-selected:opacity-100 aria-selected:font-semibold",
      "aria-selected:bg-[#e86f00] aria-selected:text-white",
      "hover:aria-selected:bg-[#d46500] hover:aria-selected:text-white"
    ),
    selected: "bg-orange-100",
    today: "ring-1 ring-[#e86f00]/40 [&>button]:font-bold",
    outside: "text-slate-300 opacity-60 aria-selected:bg-orange-50/60 aria-selected:text-orange-900",
    disabled: "text-slate-300 opacity-40",
    range_start: "rounded-l-md bg-orange-100 [&>button]:bg-[#e86f00] [&>button]:text-white [&>button]:font-bold",
    range_middle: "rounded-none bg-orange-100 [&>button]:bg-orange-200 [&>button]:text-orange-950 [&>button]:font-semibold",
    range_end: "rounded-r-md bg-orange-100 [&>button]:bg-[#e86f00] [&>button]:text-white [&>button]:font-bold",
  };

  const mergedClassNames = {
    ...defaultClassNames,
    ...classNames,
    day_button: cn(defaultClassNames.day_button, classNames?.day_button),
    range_start: cn(defaultClassNames.range_start, classNames?.range_start),
    range_middle: cn(defaultClassNames.range_middle, classNames?.range_middle),
    range_end: cn(defaultClassNames.range_end, classNames?.range_end),
    selected: cn(defaultClassNames.selected, classNames?.selected),
    today: cn(defaultClassNames.today, classNames?.today),
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={mergedClassNames}
      components={{
        IconLeft: ({ className: iconClassName, ...rest }) => (
          <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...rest} />
        ),
        IconRight: ({ className: iconClassName, ...rest }) => (
          <ChevronRight className={cn("h-4 w-4", iconClassName)} {...rest} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
