export interface InterviewSession {
  currentQuestionIndex: number;
  questions: string[];
  userAnswers: string[];
  aiResponses: string[];
  isListening: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
}

export interface QuestionEvaluation {
  isCorrect: boolean;
  feedback: string;
  score: number;
}