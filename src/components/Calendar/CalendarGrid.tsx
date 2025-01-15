import React from "react";
import { format, addDays, isSameDay } from "date-fns";

interface CalendarGridProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function CalendarGrid({
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const today = new Date();
  const next10Days = Array.from({ length: 10 }, (_, i) => addDays(today, i));

  return (
    <div className="relative">
      {/* Mobile View - Scrollable */}
      <div className="md:hidden">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-2 min-w-fit mx-auto">
            {next10Days.map((date) => (
              <button
                key={date.toString()}
                onClick={() => onDateSelect(date)}
                className={`
                  flex-shrink-0 w-24 p-3 rounded-lg border 
                  ${
                    isSameDay(date, selectedDate || new Date(-1))
                      ? "bg-amber-500 text-gray-900 border-amber-600"
                      : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/50"
                  }
                  transition-colors cursor-pointer
                `}
              >
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {format(date, "EEE")}
                  </div>
                  <div className="text-lg font-bold">{format(date, "d")}</div>
                  <div className="text-xs">{format(date, "MMM")}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-900 w-4" />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-gray-900 w-4" />
      </div>

      {/* Desktop View - Grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 gap-2">
          {next10Days.map((date) => (
            <button
              key={date.toString()}
              onClick={() => onDateSelect(date)}
              className={`
                p-3 rounded-lg border 
                ${
                  isSameDay(date, selectedDate || new Date(-1))
                    ? "bg-amber-500 text-gray-900 border-amber-600"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/50"
                }
                transition-colors cursor-pointer
              `}
            >
              <div className="text-center">
                <div className="text-sm font-medium">{format(date, "EEE")}</div>
                <div className="text-lg font-bold">{format(date, "d")}</div>
                <div className="text-xs">{format(date, "MMM")}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
