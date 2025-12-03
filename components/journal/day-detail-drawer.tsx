"use client";

import { useState } from "react";
import { X, Sparkles, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JournalDay, Trade } from "./mock-data";

interface DayDetailDrawerProps {
  day: JournalDay | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  politics: "text-purple-500",
  sports: "text-orange-500",
  crypto: "text-blue-500",
  science: "text-green-500",
};

const categoryLabels: Record<string, string> = {
  politics: "Politics",
  sports: "Sports",
  crypto: "Crypto",
  science: "Science/News",
};

export function DayDetailDrawer({ day, isOpen, onClose }: DayDetailDrawerProps) {
  const [notes, setNotes] = useState(day?.notes || "");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!day) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(0)}¢`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount >= 0 ? "+" : ""}$${amount.toFixed(2)}`;
  };

  // Group trades by category
  const tradesByCategory: Record<string, Trade[]> = {};
  day.trades.forEach((trade) => {
    if (!tradesByCategory[trade.category]) {
      tradesByCategory[trade.category] = [];
    }
    tradesByCategory[trade.category].push(trade);
  });

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[640px] bg-background border-l border-border/50 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-6 z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{formatDate(day.date)}</h2>
                {day.categories.map((cat) => (
                  <span
                    key={cat}
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${categoryColors[cat]} bg-secondary/30`}
                  >
                    {categoryLabels[cat]}
                  </span>
                ))}
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Daily P&L</span>
                  <p
                    className={`text-2xl font-bold mt-0.5 ${
                      day.pnl >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(day.pnl)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Volume</span>
                  <p className="text-xl font-semibold mt-0.5">${day.volume}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Trades</span>
                  <p className="text-xl font-semibold mt-0.5">{day.trades.length}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: Trade List */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Trades</h3>
            <div className="space-y-4">
              {Object.entries(tradesByCategory).map(([category, trades]) => (
                <div key={category} className="space-y-2">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-secondary/20 rounded-lg p-4 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-base">{trade.market}</h5>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${categoryColors[category]} bg-secondary/50`}
                            >
                              {categoryLabels[category]}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {formatPrice(trade.entry)}
                            <span className="mx-2 text-muted-foreground/50">→</span>
                            {formatPrice(trade.exit)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xl font-bold ${
                              trade.outcome === "win"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {formatCurrency(trade.pnl)}
                          </div>
                        </div>
                      </div>
                      {trade.missed_profit && trade.missed_profit > 0 && (
                        <div className="flex items-start gap-2 text-xs bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mt-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                              Early Exit
                            </span>
                            <p className="text-muted-foreground mt-0.5">
                              Missed ${trade.missed_profit.toFixed(2)} potential profit. Market resolved at $1.00.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Journaling Inputs */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Notes</h3>
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you learn from today's trades?"
                  className="w-full min-h-[140px] p-4 rounded-lg bg-secondary/20 border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Screenshots
                </label>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/30 hover:bg-secondary/10 transition-all cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    Drag and drop screenshots or click to browse
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: AI Analysis */}
          <div>
            <Button
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/5"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {showAIAnalysis ? "Hide" : "Get"} AI Analysis
            </Button>

            {showAIAnalysis && (
              <div className="mt-4 space-y-4 bg-primary/5 border border-primary/20 rounded-lg p-5">
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Market Context
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Election day saw unprecedented volatility. Trump odds
                    shifted dramatically between 6-8 PM EST as early results
                    came in. Your exit at 85¢ was well-timed given the
                    uncertainty, though the market eventually settled at $1.00
                    by midnight.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Entry Timing Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your entry at 60¢ came 2 hours before polls closed,
                    capturing the pre-result uncertainty discount. This was a
                    strong entry point. Consider holding through initial
                    volatility next time - your exit was 3 hours before
                    resolution.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Risk Assessment</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Position sizing was appropriate at 40% of daily volume.
                    Your crypto hedge (BTC &gt; $70k) showed good
                    diversification strategy during political volatility.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
