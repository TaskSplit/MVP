export interface Session {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
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

// AI response shape from Gemini
export interface AIBreakdownResponse {
  title: string;
  rounds: {
    name: string;
    steps: string[];
  }[];
}
