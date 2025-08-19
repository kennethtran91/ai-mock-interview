import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  InterviewSession,
  QuestionEvaluation,
} from '../models/interview.model';
import { NATURALIZATION_QUESTIONS, QUESTION_ANSWERS } from '../data/questions';

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private sessionSubject = new BehaviorSubject<InterviewSession>({
    currentQuestionIndex: 0,
    questions: this.selectRandomQuestions(),
    userAnswers: [],
    aiResponses: [],
    isListening: false,
    isProcessing: false,
    isCompleted: false,
  });

  public session$ = this.sessionSubject.asObservable();

  constructor() {}

  // Select 10 random questions like the real naturalization test
  private selectRandomQuestions(): string[] {
    const shuffled = [...NATURALIZATION_QUESTIONS].sort(
      () => Math.random() - 0.5
    );
    return shuffled.slice(0, 10);
  }

  getCurrentSession(): InterviewSession {
    return this.sessionSubject.value;
  }

  updateSession(updates: Partial<InterviewSession>) {
    const currentSession = this.sessionSubject.value;
    this.sessionSubject.next({ ...currentSession, ...updates });
  }

  getCurrentQuestion(): string {
    const session = this.sessionSubject.value;
    return session.questions[session.currentQuestionIndex];
  }

  addUserAnswer(answer: string) {
    const session = this.sessionSubject.value;
    const updatedAnswers = [...session.userAnswers, answer];
    this.updateSession({ userAnswers: updatedAnswers });
  }

  addAIResponse(response: string) {
    const session = this.sessionSubject.value;
    const updatedResponses = [...session.aiResponses, response];
    this.updateSession({ aiResponses: updatedResponses });
  }

  moveToNextQuestion() {
    const session = this.sessionSubject.value;
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= session.questions.length) {
      this.updateSession({ isCompleted: true });
    } else {
      this.updateSession({ currentQuestionIndex: nextIndex });
    }
  }

  resetInterview() {
    this.sessionSubject.next({
      currentQuestionIndex: 0,
      questions: this.selectRandomQuestions(),
      userAnswers: [],
      aiResponses: [],
      isListening: false,
      isProcessing: false,
      isCompleted: false,
    });
  }

  // Enhanced local evaluation for naturalization test
  evaluateAnswerLocally(
    question: string,
    userAnswer: string
  ): QuestionEvaluation {
    const expectedAnswers =
      QUESTION_ANSWERS[question as keyof typeof QUESTION_ANSWERS] || [];
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Strict match: exact or high fuzzy similarity
    const isCorrect = expectedAnswers.some((expected) => {
      const expectedLower = expected.toLowerCase().trim();
      // Exact match or high fuzzy similarity only
      return (
        userAnswerLower === expectedLower ||
        this.fuzzyMatch(userAnswerLower, expectedLower)
      );
    });

    let feedback: string;
    if (isCorrect) {
      feedback = "Correct! That's the right answer.";
    } else {
      const correctAnswers = expectedAnswers.slice(0, 2).join(' or ');
      feedback = `Not quite right. The correct answer is: ${correctAnswers}.`;
    }

    return {
      isCorrect,
      feedback,
      score: isCorrect ? 8 : 2,
    };
  }

  // Simple fuzzy matching for common variations
  private fuzzyMatch(input: string, expected: string): boolean {
    const normalize = (str: string) =>
      str
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normalInput = normalize(input);
    const normalExpected = normalize(expected);

    if (!normalInput || !normalExpected) return false;

    const inputWords = normalInput.split(' ');
    const expectedWords = normalExpected.split(' ');

    const matches = inputWords.filter((word) =>
      expectedWords.some((expectedWord) => word === expectedWord)
    );

    // Require at least 70% word overlap for fuzzy match
    return (
      matches.length > 0 &&
      matches.length >= Math.max(inputWords.length, expectedWords.length) * 0.7
    );
  }
}
