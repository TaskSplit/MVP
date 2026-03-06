export type SessionStatus = "active" | "completed";

export interface Session {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  status: SessionStatus;
  created_at: string;
}

export interface Round {
  id: string;
  session_id: string;
  name: string;
  order_index: number;
}

export interface Step {
  id: string;
  round_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

// Round with nested steps
export interface RoundWithSteps extends Round {
  steps: Step[];
}

// Session with nested rounds and steps
export interface SessionWithRounds extends Session {
  rounds: RoundWithSteps[];
}

// Session file attachment
export interface SessionFile {
  id: string;
  session_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

// AI response shape from Gemini
export interface AIBreakdownResponse {
  title: string;
  rounds: {
    name: string;
    steps: string[];
  }[];
}
