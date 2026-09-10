import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
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
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showSplash = false;
  checkingConnection = false;
  loadingData = false;
  checkingUpdate = false;
  updatingApp = false;
  serverFailed = false;
  progress = 0;
  isMobileApp = Capacitor.isNativePlatform();

  private progressTimer?: number;

  constructor(private readonly http: HttpClient) {
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

  ngOnInit() {
    if (this.isMobileApp) {
      this.showSplash = true;
      void this.checkServerConnection();
    } else {
      this.showSplash = false;
    }
  }

  private async checkServerConnection() {
    this.checkingConnection = true;
    this.loadingData = false;
    this.checkingUpdate = false;
    this.serverFailed = false;
    this.progress = 0;
    this.startProgress(0, 60, 2600);

    try {
      await firstValueFrom(
        this.http.get<{ status: string }>(`${environment.apiUrl}/health`).pipe(
          timeout(5000),
          catchError(() => {
            throw new Error('Connection failed');
          }),
        ),
      );

      this.checkingConnection = false;
      this.loadingData = true;
      this.startProgress(60, 80, 2600);

      await new Promise((resolve) => setTimeout(resolve, 2600));

      this.loadingData = false;

      if (this.isMobileApp) {
        this.checkingUpdate = true;
        this.startProgress(80, 100, 1800);

        const updateInfo = await this.checkForAppUpdate();

        if (updateInfo.updateAvailable) {
          this.checkingUpdate = false;
          this.updatingApp = true;
          this.progress = 100;

          const downloadUrl = updateInfo.downloadUrl || 'assets/ISDStaffLocator.apk';

          await new Promise((resolve) => setTimeout(resolve, 1500));
          window.location.href = downloadUrl;
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      this.showSplash = false;
    } catch {
      this.stopProgress();
      this.checkingConnection = false;
      this.loadingData = false;
      this.checkingUpdate = false;
      this.serverFailed = true;
      this.progress = 100;
    }
  }

  private async checkForAppUpdate(): Promise<{ updateAvailable: boolean; downloadUrl: string }> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ latestVersion?: string; downloadUrl?: string }>(`${environment.apiUrl}/app-update`).pipe(
          timeout(5000),
        ),
      );

      const latestVersion = response.latestVersion ?? environment.appVersion;
      const downloadUrl = response.downloadUrl ?? 'assets/ISDStaffLocator.apk';

      return {
        updateAvailable: this.isVersionGreater(latestVersion, environment.appVersion),
        downloadUrl,
      };
    } catch {
      return { updateAvailable: false, downloadUrl: 'assets/ISDStaffLocator.apk' };
    }
  }

  private isVersionGreater(latestVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => version.split('.').map((part) => Number(part) || 0);
    const latest = parseVersion(latestVersion);
    const current = parseVersion(currentVersion);

    const length = Math.max(latest.length, current.length);

    for (let index = 0; index < length; index += 1) {
      const latestPart = latest[index] ?? 0;
      const currentPart = current[index] ?? 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  private startProgress(start: number, end: number, duration: number) {
    this.stopProgress();

    const startTime = performance.now();

    this.progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      this.progress = Math.round(start + ((end - start) * ratio));

      if (ratio >= 1) {
        this.stopProgress();
      }
    }, 30);
  }

  private stopProgress() {
    if (this.progressTimer) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }
}
