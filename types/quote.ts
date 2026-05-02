export interface QuoteLineItem {
  service: string;
  quotedPrice: number;
  verdict: "FAIR" | "HIGH" | "RED_FLAG";
  fairRange: string;
  note: string;
  askMechanic: string;
}

export interface QuoteAnalysis {
  lineItems: QuoteLineItem[];
  totalQuoted: number;
  totalFair: string;
  overallVerdict: "FAIR" | "HIGH" | "RED_FLAG";
  summary: string;
  redFlags: string[];
  negotiationScript: string;
}
