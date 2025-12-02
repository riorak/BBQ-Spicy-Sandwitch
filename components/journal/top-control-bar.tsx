"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "./mock-data";

const categories: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "science", label: "Science/News" },
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
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {monthYear}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left: Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right: KPIs */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Net PnL</span>
              <span
                className={`font-bold ${
                  kpis.netPnL >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatCurrency(kpis.netPnL)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Win Rate</span>
              <span className="font-bold">{kpis.winRate.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Grade</span>
              <span className="font-bold">{kpis.accuracyGrade}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">
                Profit Factor
              </span>
              <span className="font-bold">
                {kpis.profitFactor >= 99
                  ? "∞"
                  : kpis.profitFactor.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
