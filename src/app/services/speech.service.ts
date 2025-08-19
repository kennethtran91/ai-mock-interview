import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  private recognition: any;
  private isListeningSubject = new BehaviorSubject<boolean>(false);
  public isListening$ = this.isListeningSubject.asObservable();

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1.1;
        utterance.volume = 1;

        // Select a more natural voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.name.includes('Google') && v.lang === 'en-US'
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }

  listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech recognition not supported');
        return;
      }

      this.isListeningSubject.next(true);

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isListeningSubject.next(false);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningSubject.next(false);
        reject(event.error);
      };

      this.recognition.onend = () => {
        this.isListeningSubject.next(false);
      };

      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListeningSubject.next(false);
    }
  }
}
