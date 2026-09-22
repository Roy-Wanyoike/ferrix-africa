// Shared client-side types for Ajira Copilot

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface StructuredProfile {
  name: string;
  summary: string;
  skills: string[];
  tags: string[];
  experience: string;
  digitalLiteracy: string;
  availability: string;
  goal: string;
  constraints: string[];
  confidence: number;
  aiSummary: string;
  verificationFlags: string[];
}

export interface MatchOpportunity {
  id: string;
  title: string;
  type: string;
  provider: string;
  location: string;
  payRange: string;
  duration?: string | null;
  description: string;
}

export interface ScoredMatch {
  id: string;
  score: number;
  reasons: string[];
  opportunity: MatchOpportunity;
}

export interface CaseSummary {
  id: string;
  ref: string;
  priority: string;
  status: string;
  request: string | null;
}

export interface AnalyzeResponse {
  profile: StructuredProfile;
  matches: ScoredMatch[];
  case: CaseSummary;
  mode: "live" | "fallback";
}

export interface CaseEvent {
  id: string;
  actor: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export interface CaseDetail {
  id: string;
  ref: string;
  priority: string;
  status: string;
  request: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    name: string | null;
    phone: string | null;
    personaLabel: string | null;
    location: string | null;
    language: string;
    skills: string[];
    experience: string | null;
    digitalLiteracy: string | null;
    availability: string | null;
    goal: string | null;
    constraints: string[];
    aiSummary: string | null;
    confidence: number | null;
    profile: StructuredProfile | null;
  };
  matches: ScoredMatch[];
  events: CaseEvent[];
}

export interface Stats {
  candidatesAssessed: number;
  placements: number;
  resolved: number;
  medianFirstContact: string;
  humanVerifiedActions: number;
}
