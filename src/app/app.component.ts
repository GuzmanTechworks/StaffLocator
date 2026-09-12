import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
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

interface AppUpdaterPlugin {
  startDownload(options: { url: string }): Promise<{ downloadId: number }>;
  getDownloadProgress(options: { downloadId: number }): Promise<{ progress: number; status: string; isComplete: boolean; isFailed: boolean }>;
  installDownloadedApk(options: { downloadId: number }): Promise<void>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

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
  connectionMessage = signal('Checking server connection...');
  updateAvailable = signal(false);
  updateDownloadUrl = signal('');
  updatePhase = signal<'checking' | 'download' | 'install' | 'complete' | 'error'>('checking');
  downloadProgress = signal(0);
  installProgress = signal(0);

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
    document.documentElement.classList.toggle('native-app', Capacitor.isNativePlatform());
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
      this.connectionMessage.set('Checking for newer application version...');

      const [appInfo, update] = await Promise.all([
        CapacitorApp.getInfo(),
        firstValueFrom(this.http.get<{ latestVersion: string; downloadUrl: string }>(`${environment.apiUrl}/app-update`).pipe(timeout(10000))),
      ]);

      if (this.isNewerVersion(update.latestVersion, appInfo.version)) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.connectionMessage.set('New application version available');
        this.updateDownloadUrl.set(this.resolveDownloadUrl(update.downloadUrl));
        this.updateAvailable.set(true);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
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

  downloadUpdate(): void {
    if (!Capacitor.isNativePlatform()) {
      window.location.assign(this.updateDownloadUrl());
      return;
    }

    this.updateAvailable.set(false);
    this.updatePhase.set('download');
    this.connectionMessage.set('Downloading update...');
    this.downloadProgress.set(0);
    this.installProgress.set(0);

    void this.startNativeDownload();
  }

  cancelUpdate(): void {
    void CapacitorApp.exitApp();
  }

  private async startNativeDownload(): Promise<void> {
    try {
      const result = await AppUpdater.startDownload({ url: this.updateDownloadUrl() });

      await this.pollDownloadProgress(result.downloadId);

      this.updatePhase.set('install');
      this.connectionMessage.set('Installing update...');
      this.installProgress.set(0);

      await AppUpdater.installDownloadedApk({ downloadId: result.downloadId });

      this.connectionMessage.set('Restarting app...');
      this.updatePhase.set('complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown update error.';
      this.connectionMessage.set(`Update failed: ${message}`);
      this.updatePhase.set('error');
      this.updateAvailable.set(false);
    }
  }

  private async pollDownloadProgress(downloadId: number): Promise<void> {
    while (true) {
      const response = await AppUpdater.getDownloadProgress({ downloadId });

      if (response.isFailed) {
        throw new Error('Download failed.');
      }

      this.downloadProgress.set(Math.max(0, Math.min(100, response.progress)));
      this.connectionMessage.set('Downloading update...');

      if (response.isComplete) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private resolveDownloadUrl(downloadUrl: string): string {
    if (/^https?:\/\//i.test(downloadUrl)) {
      return downloadUrl;
    }

    const appUrl = environment.apiUrl.replace(/\/api\/?$/, '/');
    return new URL(downloadUrl || 'assets/ISDStaffLocator.apk', appUrl).toString();
  }
}