import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../environments/environment';
import { StaffLocatorService } from './core/staff-locator.service';
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
export class AppComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly staffLocator = inject(StaffLocatorService);
  showSplash = signal(Capacitor.isNativePlatform());
  connectionMessage = signal('Checking connection to server');

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

  ngOnInit(): void {

    if (!this.showSplash()) {
      return;
    }

    void this.checkServerConnection();
  }

  private async checkServerConnection(): Promise<void> {
    try {
      await firstValueFrom(this.http.get(`${environment.apiUrl}/health`).pipe(timeout(10000)));
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.connectionMessage.set('Checking for new application updates..');

      const [appInfo, update] = await Promise.all([
        CapacitorApp.getInfo(),
        firstValueFrom(this.http.get<{ latestVersion: string; downloadUrl: string }>(`${environment.apiUrl}/app-update`).pipe(timeout(10000))),
      ]);

      if (this.isNewerVersion(update.latestVersion, appInfo.version)) {
        window.location.assign(update.downloadUrl || 'assets/ISDStaffLocator.apk');
        return;
      }

      const destination = this.staffLocator.session ? '/home' : '/sign-in';
      await this.router.navigateByUrl(destination);
      this.showSplash.set(false);
    } catch {
      this.connectionMessage.set('Connection to server Failed.');
    }
  }

  private isNewerVersion(latestVersion: string, currentVersion: string): boolean {
    const latest = latestVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);
    const length = Math.max(latest.length, current.length);

    for (let index = 0; index < length; index++) {
      const latestPart = latest[index] ?? 0;
      const currentPart = current[index] ?? 0;

      if (latestPart !== currentPart) {
        return latestPart > currentPart;
      }
    }

    return false;
  }
}