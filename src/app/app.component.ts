import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  closeOutline,
  downloadOutline,
  gridOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  menuOutline,
  moonOutline,
  settingsOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    addIcons({
      'alert-circle-outline': alertCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'chevron-down-outline': chevronDownOutline,
      'close-outline': closeOutline,
      'download-outline': downloadOutline,
      'grid-outline': gridOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-in-outline': logInOutline,
      'log-out-outline': logOutOutline,
      'menu-outline': menuOutline,
      'moon-outline': moonOutline,
      'settings-outline': settingsOutline,
      'sunny-outline': sunnyOutline,
      'time-outline': timeOutline,
    });

    document.documentElement.classList.toggle(
      'ion-palette-dark',
      localStorage.getItem('staff-locator-theme') === 'dark',
    );
  }
}
