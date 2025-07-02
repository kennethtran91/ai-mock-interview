import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgClass, CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { InterviewComponent } from './components/interview.component';

@NgModule({
  declarations: [    InterviewComponent,
    AppComponent,
    
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgClass,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }