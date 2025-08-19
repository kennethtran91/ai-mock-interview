import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpeechService } from '../services/speech.service';
import { InterviewService } from '../services/interview.service';
import { InterviewSession, QuestionEvaluation } from '../models/interview.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.scss'],
})
export class InterviewComponent implements OnInit, OnDestroy {
  session: InterviewSession;
  private subscriptions: Subscription[] = [];
  hasStarted = false;
  isMuted = false;
  isStopped = false;

  constructor(
    private speechService: SpeechService,
    private interviewService: InterviewService
  ) {
    this.session = this.interviewService.getCurrentSession();
  }

  ngOnInit() {
    // Subscribe to session changes
    const sessionSub = this.interviewService.session$.subscribe(
      session => this.session = session
    );
    this.subscriptions.push(sessionSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Starting page methods
  startTest() {
    this.hasStarted = true;
    this.startInterview();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  // Test control methods
  stopTest() {
    if (confirm('Are you sure you want to stop the test? Your progress will be lost.')) {
      this.isStopped = true;
      this.speechService.stopListening();
    if (this.speechService.cancel) {
      this.speechService.cancel();
    }
      this.hasStarted = false;
      this.interviewService.resetInterview();
    }
  }

  goBackToStart() {
    this.hasStarted = false;
    this.interviewService.resetInterview();
  }

  restartTest() {
    this.hasStarted = true;
    this.interviewService.resetInterview();
    this.startInterview();
  }

  // Main interview flow
  async startInterview() {
    if (this.isStopped) return;
    await this.delay(1000);
    await this.askCurrentQuestion();
  }

  async askCurrentQuestion() {
    if (this.isStopped) return;
    const question = this.getCurrentQuestion();
    if (!this.isMuted) {
      await this.speechService.speak(question);
    }
  }

  async repeatQuestion() {
    if (this.isStopped) return;
    if (!this.isMuted) {
      await this.askCurrentQuestion();
    }
  }

  getCurrentQuestion(): string {
    return this.interviewService.getCurrentQuestion();
  }

  async startListening() {
    if (this.isStopped) return;
    try {
      this.interviewService.updateSession({ isListening: true });
      
      const userAnswer = await this.speechService.listen();
      
      this.interviewService.updateSession({ 
        isListening: false, 
        isProcessing: true 
      });

      // Add user answer to session
      this.interviewService.addUserAnswer(userAnswer);

      // Evaluate the answer
      await this.evaluateAnswer(userAnswer);

    } catch (error) {
      console.error('Speech recognition error:', error);
      this.interviewService.updateSession({ 
        isListening: false, 
        isProcessing: false 
      });
      
      if (!this.isMuted) {
        await this.speechService.speak("I didn't catch that. Please try again.");
      }
    }
  }

  async evaluateAnswer(userAnswer: string) {
    if (this.isStopped) return;
    try {
      const question = this.getCurrentQuestion();
      // Only use local evaluation
      const localEvaluation = this.interviewService.evaluateAnswerLocally(question, userAnswer);
      await this.handleEvaluation(localEvaluation);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      
      if (!this.isMuted) {
        await this.speechService.speak("I had trouble evaluating your answer. Let's move to the next question.");
      }
      
      this.moveToNext();
    }
  }

  async handleEvaluation(evaluation: QuestionEvaluation) {
    if (this.isStopped) return;
    // Speak the feedback only if not muted
    if (!this.isMuted) {
      await this.speechService.speak(evaluation.feedback);
    }
    
    // Add AI response to session
    this.interviewService.addAIResponse(evaluation.feedback);

    // Move to next question or complete interview
    await this.delay(1000);
    this.moveToNext();
  }

  async moveToNext() {
    if (this.isStopped) return;
    this.interviewService.moveToNextQuestion();
    this.interviewService.updateSession({ isProcessing: false });

    if (!this.session.isCompleted) {
      await this.delay(1500);
      
      if (!this.isMuted) {
        await this.speechService.speak("Next question:");
        await this.delay(500);
      }
      
      await this.askCurrentQuestion();
    } else {
      await this.delay(1000);
      
      if (!this.isMuted) {
        const correctAnswers = this.getCorrectAnswersCount();
        const passed = correctAnswers >= 6;
        
        if (passed) {
          await this.speechService.speak(`Congratulations! You answered ${correctAnswers} out of ${this.session.questions.length} questions correctly. You have passed the naturalization civics test! You are one step closer to becoming a U.S. citizen.`);
        } else {
          await this.speechService.speak(`You answered ${correctAnswers} out of ${this.session.questions.length} questions correctly. You need at least 6 correct answers to pass. Please study more and try again. Good luck!`);
        }
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCorrectAnswersCount(): number {
    return this.session.aiResponses.filter(response => 
      response.toLowerCase().includes('correct') || 
      response.toLowerCase().includes('right')
    ).length;
  }

  isPassed(): boolean {
    return this.getCorrectAnswersCount() >= 6;
  }
}