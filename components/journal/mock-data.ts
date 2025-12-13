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
  date: string; // ISO format YYYY-MM-TYPE shit
  pnl: number;
  volume: number;
  categories: Exclude<Category, "all">[];
  trades: Trade[];
  notes?: string;
  screenshots?: string[];
}

// Mock data for November 2024
export const mockJournalData: JournalDay[] = [
  {
    date: "2024-11-05",
    pnl: 450.0,
    volume: 2500,
    categories: ["politics", "crypto"],
    trades: [
      {
        id: 101,
        market: "US Election Winner - Trump",
        category: "politics",
        entry: 0.6,
        exit: 0.85,
        outcome: "win",
        pnl: 250.0,
        missed_profit: 150.0,
      },
      {
        id: 102,
        market: "Bitcoin > $70k by Nov 10",
        category: "crypto",
        entry: 0.45,
        exit: 0.65,
        outcome: "win",
        pnl: 200.0,
      },
    ],
    notes: "Election day volatility was insane. Got out early on Trump but still profitable.",
  },
  {
    date: "2024-11-07",
    pnl: -180.0,
    volume: 1200,
    categories: ["sports"],
    trades: [
      {
        id: 103,
        market: "Lakers vs Warriors - Lakers Win",
        category: "sports",
        entry: 0.55,
        exit: 0.35,
        outcome: "loss",
        pnl: -180.0,
      },
    ],
  },
  {
    date: "2024-11-12",
    pnl: 320.0,
    volume: 1800,
    categories: ["politics", "science"],
    trades: [
      {
        id: 104,
        market: "Senate Control - Republicans",
        category: "politics",
        entry: 0.52,
        exit: 0.78,
        outcome: "win",
        pnl: 260.0,
      },
      {
        id: 105,
        market: "SpaceX Starship Launch Success",
        category: "science",
        entry: 0.7,
        exit: 0.75,
        outcome: "win",
        pnl: 60.0,
      },
    ],
    notes: "Good read on Senate races. SpaceX was easy money.",
  },
  {
    date: "2024-11-15",
    pnl: -95.0,
    volume: 800,
    categories: ["crypto"],
    trades: [
      {
        id: 106,
        market: "ETH > $2000 by Nov 20",
        category: "crypto",
        entry: 0.6,
        exit: 0.45,
        outcome: "loss",
        pnl: -95.0,
      },
    ],
  },
  {
    date: "2024-11-18",
    pnl: 580.0,
    volume: 3200,
    categories: ["politics"],
    trades: [
      {
        id: 107,
        market: "Trump Cabinet Picks - Rubio State",
        category: "politics",
        entry: 0.35,
        exit: 0.92,
        outcome: "win",
        pnl: 580.0,
        missed_profit: 80.0,
      },
    ],
    notes: "Leaked info helped. Sold too early but still great trade.",
  },
  {
    date: "2024-11-22",
    pnl: 125.0,
    volume: 950,
    categories: ["sports", "crypto"],
    trades: [
      {
        id: 108,
        market: "NFL - 49ers Win NFC West",
        category: "sports",
        entry: 0.48,
        exit: 0.58,
        outcome: "win",
        pnl: 75.0,
      },
      {
        id: 109,
        market: "Bitcoin ATH in November",
        category: "crypto",
        entry: 0.65,
        exit: 0.7,
        outcome: "win",
        pnl: 50.0,
      },
    ],
  },
  {
    date: "2024-11-25",
    pnl: -220.0,
    volume: 1500,
    categories: ["politics", "sports"],
    trades: [
      {
        id: 110,
        market: "Government Shutdown by Dec 1",
        category: "politics",
        entry: 0.42,
        exit: 0.28,
        outcome: "loss",
        pnl: -140.0,
      },
      {
        id: 111,
        market: "Cowboys Make Playoffs",
        category: "sports",
        entry: 0.55,
        exit: 0.45,
        outcome: "loss",
        pnl: -80.0,
      },
    ],
    notes: "Bad timing on both. Should have waited for more info.",
  },
  {
    date: "2024-11-28",
    pnl: 410.0,
    volume: 2100,
    categories: ["crypto", "science"],
    trades: [
      {
        id: 112,
        market: "Crypto Market Cap > $2T",
        category: "crypto",
        entry: 0.58,
        exit: 0.88,
        outcome: "win",
        pnl: 300.0,
      },
      {
        id: 113,
        market: "AI Breakthrough Announced in Q4",
        category: "science",
        entry: 0.45,
        exit: 0.65,
        outcome: "win",
        pnl: 110.0,
      },
    ],
  },
];
