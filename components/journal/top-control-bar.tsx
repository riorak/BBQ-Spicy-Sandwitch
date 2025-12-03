"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import type { Category } from "./mock-data";

const categories: { value: Category; label: string }[] = [
  { value: "all", label: "All Markets" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "science", label: "Science" },
];

interface KPIs {
  netPnL: number;
  winRate: number;
  accuracyGrade: string;
  profitFactor: number;
}

interface TopControlBarProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  kpis: KPIs;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function TopControlBar({
  selectedCategory,
  onCategoryChange,
  kpis,
  currentMonth,
  onMonthChange,
}: TopControlBarProps) {
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}$${amount.toFixed(0)}`;
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex flex-col gap-5">
          {/* Top Row: Month Navigation & Categories */}
          <div className="flex items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-9 w-9 hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold min-w-[180px] text-center">
                {monthYear}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="h-9 w-9 hover:bg-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedCategory === cat.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {/* Net PnL Card */}
            <div className="bg-secondary/30 rounded-lg px-4 py-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Net P&L
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      kpis.netPnL >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(kpis.netPnL)}
                  </p>
                </div>
                {kpis.netPnL >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500/40" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500/40" />
                )}
              </div>
            </div>

            {/* Win Rate Card */}
            <div className="bg-secondary/30 rounded-lg px-4 py-3 border border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Win Rate
              </p>
              <p className="text-2xl font-bold">
                {kpis.winRate.toFixed(0)}%
              </p>
            </div>

            {/* Accuracy Grade Card */}
            <div className="bg-secondary/30 rounded-lg px-4 py-3 border border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Grade
              </p>
              <p className="text-2xl font-bold text-primary">
                {kpis.accuracyGrade}
              </p>
            </div>

            {/* Profit Factor Card */}
            <div className="bg-secondary/30 rounded-lg px-4 py-3 border border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Profit Factor
              </p>
              <p className="text-2xl font-bold">
                {kpis.profitFactor >= 99
                  ? "∞"
                  : kpis.profitFactor.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
