"use client";

import type { JournalDay } from "./mock-data";

interface CalendarGridProps {
  data: JournalDay[];
  currentMonth: Date;
  onDayClick: (day: JournalDay) => void;
}

const categoryColors: Record<string, string> = {
  politics: "bg-purple-500",
  sports: "bg-orange-500",
  crypto: "bg-blue-500",
  science: "bg-green-500",
};

export function CalendarGrid({ data, currentMonth, onDayClick }: CalendarGridProps) {
  // Get days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Create array of days with their data
  const days: Array<{ date: number; data?: JournalDay }> = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: 0 });
  }

  // Add actual days
  for (let date = 1; date <= daysInMonth; date++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    const dayData = data.find((d) => d.date === dateString);
    days.push({ date, data: dayData });
  }

  const getBackgroundOpacity = (pnl: number) => {
    const maxPnl = Math.max(...data.map((d) => Math.abs(d.pnl)), 100);
    const intensity = Math.min(Math.abs(pnl) / maxPnl, 1);
    return 0.1 + intensity * 0.4; // Range from 10% to 50% opacity
  };

  const getCellBackground = (dayData?: JournalDay) => {
    if (!dayData) return "bg-background";
    
    const opacity = getBackgroundOpacity(dayData.pnl);
    if (dayData.pnl > 0) {
      return `bg-green-500`;
    } else if (dayData.pnl < 0) {
      return `bg-red-500`;
    }
    return "bg-gray-500";
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1 min-h-0">
        {days.map((day, index) => {
          if (day.date === 0) {
            return <div key={`empty-${index}`} className="w-full h-full" />;
          }

          const hasData = !!day.data;
          const opacity = hasData ? getBackgroundOpacity(day.data!.pnl) : 0;

          return (
            <button
              key={day.date}
              onClick={() => day.data && onDayClick(day.data)}
              disabled={!hasData}
              className={`w-full h-full rounded-lg border border-border p-2 relative transition-all ${
                hasData
                  ? "cursor-pointer hover:scale-105 hover:shadow-lg"
                  : "cursor-default opacity-40"
              }`}
              style={{
                backgroundColor: hasData
                  ? day.data!.pnl > 0
                    ? `rgba(34, 197, 94, ${opacity})`
                    : day.data!.pnl < 0
                    ? `rgba(239, 68, 68, ${opacity})`
                    : `rgba(107, 114, 128, ${opacity})`
                  : "transparent",
              }}
            >
              {/* Date number */}
              <div className="absolute top-2 left-2 text-sm font-medium">
                {day.date}
              </div>

              {/* PnL */}
              {hasData && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div
                    className={`text-lg font-bold ${
                      day.data!.pnl > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {day.data!.pnl > 0 ? "+" : ""}$
                    {Math.abs(day.data!.pnl).toFixed(0)}
                  </div>
                </div>
              )}

              {/* Category dots */}
              {hasData && day.data!.categories.length > 0 && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {day.data!.categories.map((cat) => (
                    <div
                      key={cat}
                      className={`w-2 h-2 rounded-full ${categoryColors[cat]}`}
                      title={cat}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
