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
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
    // Keyboard navigation for lightbox
    useEffect(() => {
      if (!lightboxOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        const maxIndex = (screenshots[selectedTrade?.id] || []).length - 1;
        if (e.key === "ArrowRight") {
          setLightboxIndex((idx) => Math.min(idx + 1, maxIndex));
        } else if (e.key === "ArrowLeft") {
          setLightboxIndex((idx) => Math.max(idx - 1, 0));
        } else if (e.key === "Escape") {
          setLightboxOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxOpen, screenshots, selectedTrade?.id]);
  const [uploading, setUploading] = useState(false);
  const [lightboxLoading, setLightboxLoading] = useState(false);

  // Clamp lightbox index when screenshots array changes
  useEffect(() => {
    if (!lightboxOpen || !selectedTrade?.id) return;
    const currentLength = (screenshots[selectedTrade.id] || []).length;
    if (currentLength === 0) {
      setLightboxOpen(false);
    } else if (lightboxIndex >= currentLength) {
      setLightboxIndex(currentLength - 1);
    }
  }, [screenshots, selectedTrade?.id, lightboxOpen]);

  const refreshTradeScreenshots = async (tradeId: number) => {
    const urls = screenshots[tradeId] || [];
    if (urls.length === 0) return;
    try {
      const refreshRes = await fetch("/app/api/journal/refresh-signed-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: urls }),
      });
      if (refreshRes.ok) {
        const { urls: newUrls } = await refreshRes.json();
        setScreenshots(prev => ({ ...prev, [tradeId]: newUrls }));
      }
    } catch (e) {
      // no-op
    }
  };

  // Preload current image when opening lightbox for smoother UX
  useEffect(() => {
    if (!lightboxOpen || !selectedTrade?.id) return;
    setLightboxLoading(true);
    const urls = screenshots[selectedTrade.id] || [];
    if (urls.length === 0) {
      setLightboxLoading(false);
      return;
    }
    // Only preload the current image
    const img = new Image();
    img.onload = () => setLightboxLoading(false);
    img.onerror = () => {
      refreshTradeScreenshots(selectedTrade.id);
      setLightboxLoading(false);
    };
    img.src = urls[lightboxIndex];
    // Also refresh signed URLs on open to reduce expiry issues
    refreshTradeScreenshots(selectedTrade.id);
  }, [lightboxOpen, selectedTrade?.id, lightboxIndex]);

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

  // Auto-save notes with debounce (only notes, not screenshots to avoid race conditions)
  useEffect(() => {
    if (!selectedTrade?.id) return;
    
    const timer = setTimeout(() => {
      // Only save if notes actually changed
      if (tradeNotes[selectedTrade.id] !== undefined) {
        saveTradeNotes(selectedTrade.id);
      }
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

  const handleDeleteScreenshot = async (tradeId: number, index: number) => {
    const currentScreenshots = [...(screenshots[tradeId] || [])];
    currentScreenshots.splice(index, 1);
    
    // Update state immediately
    setScreenshots(prev => ({ ...prev, [tradeId]: currentScreenshots }));
    
    // Save with the updated array explicitly
    try {
      await fetch("/app/api/journal/trade-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_id: tradeId,
          notes: tradeNotes[tradeId] || "",
          screenshots: currentScreenshots,
        }),
      });
    } catch (error) {
      console.error("Failed to save after delete:", error);
    }
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
                        <div key={i} className="relative group">
                          <button
                            type="button"
                            className="rounded border border-border/50 w-full h-24 bg-black/5 flex items-center justify-center p-0"
                            onClick={() => {
                              setLightboxIndex(i);
                              setLightboxOpen(true);
                            }}
                          >
                            <img
                              src={url}
                              alt={`Screenshot ${i + 1}`}
                              loading="lazy"
                              className="object-contain w-full h-24"
                              onError={() => refreshTradeScreenshots(selectedTrade.id)}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScreenshot(selectedTrade.id, i);
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                            aria-label="Delete screenshot"
                          >
                            ✕
                          </button>
                        </div>
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

      {/* Global Lightbox Modal (outside drawer) */}
      {lightboxOpen && selectedTrade?.id && screenshots[selectedTrade.id] && (
        <div className="fixed inset-0 z-[100] bg-black/90" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* Image */}
            {lightboxLoading && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">Loading…</div>
            )}
            <img
              src={screenshots[selectedTrade.id][lightboxIndex]}
              alt={`Screenshot ${lightboxIndex + 1}`}
              className="object-contain max-h-[85vh] max-w-[95vw] w-auto h-auto md:max-w-[1200px]"
              onError={async () => {
                await refreshTradeScreenshots(selectedTrade.id);
                setLightboxIndex((idx) => {
                  const total = (screenshots[selectedTrade.id] || []).length;
                  return Math.min(Math.max(0, idx), Math.max(0, total - 1));
                });
              }}
            />

            {/* Left arrow */}
            <button
              type="button"
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white px-2 py-1 rounded"
              disabled={lightboxIndex === 0}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx => Math.max(0, idx - 1)); }}
            >
              <span className="text-2xl">‹</span>
            </button>

            {/* Right arrow */}
            <button
              type="button"
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white px-2 py-1 rounded"
              disabled={lightboxIndex === screenshots[selectedTrade.id].length - 1}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx => Math.min(screenshots[selectedTrade.id].length - 1, idx + 1)); }}
            >
              <span className="text-2xl">›</span>
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs">
              {lightboxIndex + 1} / {screenshots[selectedTrade.id].length}
            </div>

            {/* Close */}
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

