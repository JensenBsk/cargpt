export interface RankedCause {
  rank: number;
  cause: string;
  reasoning: string;
  likelihood: "Most Likely" | "Likely" | "Possible" | "Unlikely but serious";
  modRelated?: boolean;
}

export interface DiagnosticStep {
  step: number;
  action: string;
  why: string;
  ifResultA: string;
  ifResultB: string;
  cost: string;
  time?: string;
  tools: string;
}

export interface ClarifyQuestion {
  question: string;
  options: string[];
}

export interface CostEstimate {
  fix: string;
  parts: string;
  labor: string;
  total: string;
  note?: string;
}

export interface Diagnostic {
  whatsWrong: string;
  modNote?: string;
  driveSafety: {
    verdict: "STOP" | "CAUTION" | "OKAY";
    reason: string;
  };
  rankedCauses: RankedCause[];
  diagnosticSteps: DiagnosticStep[];
  costEstimates: CostEstimate[];
  dontDoThis: string[];
  preventionTips?: string[];
  mechanicEscalation: {
    needed: boolean;
    reason: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
