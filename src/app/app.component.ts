import { Component } from '@angular/core';
import { InterviewComponent } from './components/interview.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InterviewComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ai-history-interviewer';
}