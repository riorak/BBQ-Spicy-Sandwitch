"use client";

import { useState } from "react";
import { CalendarGrid } from "./calendar-grid";
import { DayDetailDrawer } from "./day-detail-drawer";
import { TopControlBar } from "./top-control-bar";
import { mockJournalData, type JournalDay, type Category } from "./mock-data";

export function JournalView() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedDay, setSelectedDay] = useState<JournalDay | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // November 2024

  // Filter data based on selected category
  const filteredData = mockJournalData.filter((day) => {
    if (selectedCategory === "all") return true;
    return day.categories.includes(selectedCategory);
  });

  // Calculate KPIs from filtered data
  const calculateKPIs = () => {
    const totalPnL = filteredData.reduce((sum, day) => sum + day.pnl, 0);
    const wins = filteredData.filter((day) => day.pnl > 0).length;
    const total = filteredData.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    // Calculate accuracy grade based on win rate
    const getGrade = (rate: number) => {
      if (rate >= 90) return "A+";
      if (rate >= 85) return "A";
      if (rate >= 80) return "A-";
      if (rate >= 75) return "B+";
      if (rate >= 70) return "B";
      if (rate >= 65) return "B-";
      if (rate >= 60) return "C+";
      return "C";
    };

    // Calculate profit factor (total gains / total losses)
    const totalGains = filteredData
      .filter((day) => day.pnl > 0)
      .reduce((sum, day) => sum + day.pnl, 0);
    const totalLosses = Math.abs(
      filteredData
        .filter((day) => day.pnl < 0)
        .reduce((sum, day) => sum + day.pnl, 0)
    );
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 99 : 0;

    return {
      netPnL: totalPnL,
      winRate,
      accuracyGrade: getGrade(winRate),
      profitFactor,
    };
  };

  const kpis = calculateKPIs();

  return (
    <div className="h-screen bg-background">
      {/* Calendar Grid - Full Height */}
      <div className="h-full px-6 py-6 overflow-auto">
        <CalendarGrid
          data={filteredData}
          currentMonth={currentMonth}
          onDayClick={setSelectedDay}
        />
      </div>

      {/* Side Drawer */}
      <DayDetailDrawer
        day={selectedDay}
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
