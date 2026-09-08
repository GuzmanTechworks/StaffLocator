import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    document.documentElement.classList.toggle(
      'ion-palette-dark',
      localStorage.getItem('staff-locator-theme') === 'dark',
    );
  }
}
