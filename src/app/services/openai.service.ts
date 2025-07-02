import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  evaluateAnswer(question: string, userAnswer: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openaiApiKey}`
    });

    const prompt = `You are a history teacher evaluating a student's answer.
    
Question: "${question}"
Student's Answer: "${userAnswer}"

Please evaluate this answer and respond in exactly this JSON format:
{
  "isCorrect": true/false,
  "feedback": "Brief feedback explaining why the answer is correct or incorrect, and provide the correct answer if wrong",
  "score": number from 0-10
}

Keep feedback concise and encouraging.`;

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}