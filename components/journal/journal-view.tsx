"use client";
import { useState, useEffect } from "react";
import { CalendarGrid } from "./calendar-grid";
import { DayDetailDrawer } from "./day-detail-drawer";
import { TopControlBar } from "./top-control-bar";

export type Category = "all" | "politics" | "sports" | "crypto" | "science";

export interface Trade {
  id: number;
  market: string;
  category: Exclude<Category, "all">;
  entry: number;
  exit: number;
  outcome: "win" | "loss";
  missed_profit?: number;
  pnl: number;
}

export interface JournalDay {
  date: string;
  pnl: number;
  volume: number;
  categories: Exclude<Category, "all">[];
  trades?: Trade[];
  notes?: string;
  screenshots?: string[];
}

export function JournalView() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedDay, setSelectedDay] = useState<JournalDay | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [data, setData] = useState<JournalDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize currentMonth on client side
  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (!currentMonth) return;
    
    const fetchData = async () => {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;
      
      const res = await fetch(`/app/api/journal/day-stats?month=${monthStr}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.days || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentMonth]);

  // Filter data based on selected category
  const filteredData = data.filter((day: JournalDay) => {
    if (selectedCategory === "all") return true;
    return day.categories.includes(selectedCategory);
  });

  // Calculate KPIs from filtered data
  const calculateKPIs = () => {
    const totalPnL = filteredData.reduce((sum: number, day: JournalDay) => sum + day.pnl, 0);
    const wins = filteredData.filter((day: JournalDay) => day.pnl > 0).length;
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
      .filter((day: JournalDay) => day.pnl > 0)
      .reduce((sum: number, day: JournalDay) => sum + day.pnl, 0);
    const totalLosses = Math.abs(
      filteredData
        .filter((day: JournalDay) => day.pnl < 0)
        .reduce((sum: number, day: JournalDay) => sum + day.pnl, 0)
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

  if (!currentMonth) {
    return (
      <div className="h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Control Bar */}
      <TopControlBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        kpis={kpis}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading...
          </div>
        ) : (
          <CalendarGrid
            data={filteredData}
            currentMonth={currentMonth!}
            onDayClick={setSelectedDay}
          />
        )}
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
