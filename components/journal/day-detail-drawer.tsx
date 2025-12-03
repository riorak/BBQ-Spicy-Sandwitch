"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Upload, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JournalDay, Trade } from "./journal-view";

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
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [tradeNotes, setTradeNotes] = useState<Record<number, string>>({});
  const [showAIAnalysis, setShowAIAnalysis] = useState<Record<number, boolean>>({});
  const [screenshots, setScreenshots] = useState<Record<number, string[]>>({});
  const [uploading, setUploading] = useState(false);

  // Fetch detailed data when day changes
  useEffect(() => {
    if (day?.date) {
      setLoading(true);
      setSelectedTrade(null);
      fetch(`/app/api/journal/day-detail?date=${day.date}`)
        .then(res => res.json())
        .then(data => {
          setDetailData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [day?.date]);

  // Load notes when trade is selected
  useEffect(() => {
    if (selectedTrade?.id) {
      fetch(`/app/api/journal/trade-notes?trade_id=${selectedTrade.id}`)
        .then(res => res.json())
        .then(async (data) => {
          setTradeNotes(prev => ({ ...prev, [selectedTrade.id]: data.notes || "" }));
          
          // Refresh signed URLs for screenshots
          if (data.screenshots && data.screenshots.length > 0) {
            const refreshRes = await fetch("/app/api/journal/refresh-signed-urls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paths: data.screenshots }),
            });
            if (refreshRes.ok) {
              const { urls } = await refreshRes.json();
              setScreenshots(prev => ({ ...prev, [selectedTrade.id]: urls }));
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedTrade?.id]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (!selectedTrade?.id || !tradeNotes[selectedTrade.id]) return;
    
    const timer = setTimeout(() => {
      saveTradeNotes(selectedTrade.id);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tradeNotes, selectedTrade?.id]);

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

  const saveTradeNotes = async (tradeId: number) => {
    try {
      await fetch("/app/api/journal/trade-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_id: tradeId,
          notes: tradeNotes[tradeId] || "",
          screenshots: screenshots[tradeId] || [],
        }),
      });
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const handleScreenshotUpload = async (tradeId: number, files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("files", file));
    formData.append("trade_id", tradeId.toString());

    try {
      const res = await fetch("/app/api/journal/upload-screenshots", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setScreenshots(prev => ({ ...prev, [tradeId]: [...(prev[tradeId] || []), ...data.urls] }));
        await saveTradeNotes(tradeId);
      }
    } catch (error) {
      console.error("Failed to upload screenshots:", error);
    }
    setUploading(false);
  };

  const handleAIAnalysis = async (tradeId: number) => {
    setShowAIAnalysis(prev => ({ ...prev, [tradeId]: !prev[tradeId] }));
    // TODO: API call to get AI analysis
  };

  // Use trades from detailData if available
  const allTrades = detailData?.trades ? Object.values(detailData.trades).flat() : [];

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
        className={`fixed top-0 right-0 h-full w-full md:w-[900px] bg-background border-l border-border/50 z-50 transform transition-transform duration-300 ease-in-out ${
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
                  <p className="text-xl font-semibold mt-0.5">{allTrades.length}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex h-[calc(100%-140px)]">
          {/* Left: Trade List */}
          <div className="w-2/5 border-r border-border/50 overflow-y-auto p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Select Trade
            </h3>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : allTrades.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No trades</div>
              ) : (
                allTrades.map((trade: any) => (
                  <button
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedTrade?.id === trade.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border bg-secondary/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-sm line-clamp-1">{trade.market}</h5>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ml-2 ${
                        selectedTrade?.id === trade.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">
                        {formatPrice(trade.entry || 0)} → {formatPrice(trade.exit || 0)}
                      </span>
                      <span
                        className={`font-bold ${
                          trade.outcome === "win" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Trade Details */}
          <div className="w-3/5 overflow-y-auto p-6">
            {!selectedTrade ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a trade to view details
              </div>
            ) : (
              <div className="space-y-6">
                {/* Trade Summary */}
                <div className="bg-secondary/20 rounded-lg p-5 border border-border/50">
                  <h4 className="font-bold text-lg mb-3">{selectedTrade.market}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                        Entry
                      </span>
                      <p className="font-semibold font-mono">{formatPrice(selectedTrade.entry || 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                        Exit
                      </span>
                      <p className="font-semibold font-mono">{formatPrice(selectedTrade.exit || 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                        P&L
                      </span>
                      <p
                        className={`font-bold text-lg ${
                          selectedTrade.pnl >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(selectedTrade.pnl)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                        Category
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          categoryColors[selectedTrade.category]
                        } bg-secondary/50`}
                      >
                        {categoryLabels[selectedTrade.category]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                    Trade Notes
                    <span className="text-xs normal-case text-muted-foreground/60 ml-2 font-normal">
                      (Auto-saves)
                    </span>
                  </label>
                  <textarea
                    value={tradeNotes[selectedTrade.id] || ""}
                    onChange={(e) =>
                      setTradeNotes((prev) => ({ ...prev, [selectedTrade.id]: e.target.value }))
                    }
                    placeholder="What was your thesis? What did you learn?"
                    className="w-full min-h-[120px] p-4 rounded-lg bg-secondary/20 border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                    Screenshots
                  </label>
                  <input
                    type="file"
                    id={`screenshot-${selectedTrade.id}`}
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleScreenshotUpload(selectedTrade.id, e.target.files)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`screenshot-${selectedTrade.id}`}
                    className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/30 hover:bg-secondary/10 transition-all cursor-pointer block"
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload screenshots"}
                    </p>
                  </label>
                  {screenshots[selectedTrade.id] && screenshots[selectedTrade.id].length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {screenshots[selectedTrade.id].map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          className="rounded border border-border/50 w-full h-24 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Analysis */}
                <div>
                  <Button
                    onClick={() => handleAIAnalysis(selectedTrade.id)}
                    variant="outline"
                    className="w-full border-primary/20 hover:bg-primary/5"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {showAIAnalysis[selectedTrade.id] ? "Hide" : "Get"} AI Analysis
                  </Button>

                  {showAIAnalysis[selectedTrade.id] && (
                    <div className="mt-4 space-y-4 bg-primary/5 border border-primary/20 rounded-lg p-5">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Trade Analysis
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Entry at {formatPrice(selectedTrade.entry || 0)} showed good timing based on market
                          conditions. {selectedTrade.outcome === "win" ? "Profitable exit" : "Loss realized"} at{" "}
                          {formatPrice(selectedTrade.exit || 0)}.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Key Insights</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Market momentum was {selectedTrade.outcome === "win" ? "favorable" : "against"} your position</li>
                          <li>Position size appropriate for volatility level</li>
                          <li>Consider holding time relative to event timeline</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
