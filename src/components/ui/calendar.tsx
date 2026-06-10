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
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // react-day-picker v10 classNames (snake_case keys)
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
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "aria-selected:bg-primary aria-selected:text-white hover:aria-selected:bg-primary hover:aria-selected:text-white"
        ),
        selected: "",
        today: "bg-slate-100 text-slate-900",
        outside: "text-slate-300 opacity-60",
        disabled: "text-slate-300 opacity-40",
        range_start: "text-white",
        range_end: "text-white",
        range_middle: "aria-selected:bg-orange-50 aria-selected:text-slate-900",
        ...classNames,
      }}
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
