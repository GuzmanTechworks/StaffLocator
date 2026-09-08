import { Component, HostListener, ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { IonInput } from '@ionic/angular';
import { interval } from 'rxjs';
import { ActiveVisit, DashboardData, DashboardEvent, StaffLocatorService } from '../core/staff-locator.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  dashboard: DashboardData = { users: [], locations: [], activeVisits: [], history: [] };
  selectedUserId: number | null = null;
  selectedLocationIds: number[] = [];
  selectedCompanionIds: number[] = [];
  selectedReturnVisitIds: number[] = [];
  isManualDestination = false;
  manualDestination = '';
  locationSearch = '';
  timeoutDate = this.currentDateValue();
  timeoutTime = this.currentTimeValue();
  timeinDate = this.currentDateValue();
  timeinTime = this.currentTimeValue();
  purpose = '';
  newFirstName = '';
  newLastName = '';
  newUsername = '';
  newPassword = '';
  newLocation = '';
  message = '';
  error = '';
  currentTime = this.formatCurrentTime();
  isDarkMode = localStorage.getItem('staff-locator-theme') === 'dark';
  @ViewChild('manualDestinationInput') private manualDestinationInput?: IonInput;
  private chimePromise: Promise<void> = Promise.resolve();
  private notificationAudioUnlocked = false;
  private notificationAudioContext?: AudioContext;

  constructor(private readonly staffLocator: StaffLocatorService, private readonly changeDetector: ChangeDetectorRef) {
    this.applyTheme();
    interval(1000).subscribe(() => {
      this.currentTime = this.formatCurrentTime();
      this.changeDetector.markForCheck();
    });
  }

  get session() { return this.staffLocator.session; }
  get currentUsername() {
    const user = this.session?.user;
    return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';
  }

  get currentRole() {
    return this.session?.user.isAdmin ? 'ADMIN' : 'STAFF';
  }

  get sortedLocations() {
    return this.dashboard.locations.filter((location) => location.name.toLowerCase().includes(this.locationSearch.toLowerCase())).sort((first, second) => first.name.localeCompare(second.name));
  }

  get availableCompanions() { return this.dashboard.users.filter((user) => user.id !== this.session?.user.id); }

  get returnGroupVisits() {
    const ownVisit = this.dashboard.activeVisits.find((visit) => visit.user.id === this.session?.user.id);
    return ownVisit?.groupId ? this.dashboard.activeVisits.filter((visit) => visit.groupId === ownVisit.groupId) : [];
  }

  get destination() {
    const selectedNames = this.dashboard.locations
      .filter((location) => this.selectedLocationIds.includes(location.id))
      .map((location) => location.name);
    return [...selectedNames, this.manualDestination.trim()].filter(Boolean).join(', ');
  }

  get selectedDestinationValues(): Array<number | string> {
    return this.isManualDestination ? [...this.selectedLocationIds, 'manual'] : this.selectedLocationIds;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('staff-locator-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  @HostListener('document:pointerdown')
  @HostListener('document:keydown')
  unlockNotificationAudio() {
    if (this.notificationAudioUnlocked) return;
    this.notificationAudioUnlocked = true;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      this.notificationAudioContext = new AudioContextClass();
      void this.notificationAudioContext.resume();
    }
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
  }

  chooseLocations(values: Array<number | string> | null) {
    const selectedValues = values ?? [];
    this.isManualDestination = selectedValues.includes('manual');
    this.selectedLocationIds = selectedValues
      .filter((value) => value !== 'manual')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
    if (!this.isManualDestination) this.manualDestination = '';
    if (this.isManualDestination) {
      window.setTimeout(() => void this.manualDestinationInput?.setFocus());
    }
  }

  private currentDateValue() {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
  }

  private currentTimeValue() {
    const now = new Date();
    const hour = now.getHours() % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  }

  private asIsoTime(date: string, time: string) {
    const dateMatch = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!dateMatch || !timeMatch) return '';
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    if (hour < 1 || hour > 12 || minute > 59) return '';
    if (timeMatch[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (timeMatch[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    const value = new Date(Number(dateMatch[3]), Number(dateMatch[1]) - 1, Number(dateMatch[2]), hour, minute);
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  logout() { this.staffLocator.session = null; this.dashboard = { users: [], locations: [], activeVisits: [], history: [] }; }

  ionViewDidEnter() {
    this.loadDashboard();
    this.staffLocator.dashboardEvents().subscribe({
      next: (event) => { this.refresh(); void this.announceDashboardEvent(event); },
      error: () => { this.error = 'Live updates disconnected. Refresh the page to reconnect.'; },
    });
  }

  private formatCurrentTime() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

  private formatAnnouncementTime() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, '');
  }

  private async playAnnouncementChime() {
    if (!this.notificationAudioUnlocked) return;
    const audioContext = this.notificationAudioContext;
    if (!audioContext) return;

    try {
      await audioContext.resume();
      const start = audioContext.currentTime;
      const playPaTone = (frequency: number, offset: number, duration: number) => {
        const tone = audioContext.createOscillator();
        const overtone = audioContext.createOscillator();
        const toneGain = audioContext.createGain();
        tone.type = 'sine';
        tone.frequency.value = frequency;
        overtone.type = 'triangle';
        overtone.frequency.value = frequency * 2;
        toneGain.gain.setValueAtTime(0.0001, start + offset);
        toneGain.gain.exponentialRampToValueAtTime(0.13, start + offset + 0.06);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
        tone.connect(toneGain);
        overtone.connect(toneGain);
        toneGain.connect(audioContext.destination);
        tone.start(start + offset);
        overtone.start(start + offset);
        tone.stop(start + offset + duration);
        overtone.stop(start + offset + duration);
      };

      playPaTone(880, 0, 0.55);
      playPaTone(660, 0.62, 0.7);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1450));
    } catch {
      // Speech still provides the notification when audio is unavailable.
    }
  }

  private async speakAnnouncement(announcement: string) {
    if (!('speechSynthesis' in window)) return;
    await Promise.race([
      this.chimePromise,
      new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
    ]);
    const speech = window.speechSynthesis;
    speech.cancel();
    speech.resume();
    if (speech.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 250);
        speech.addEventListener('voiceschanged', () => {
          window.clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }
    const utterance = new SpeechSynthesisUtterance(announcement);
    const femaleVoice = speech.getVoices().find((voice) => /female|samantha|victoria|karen|zira|aria|ava|susan|hazel/i.test(voice.name));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.08;
    utterance.rate = 0.95;
    speech.speak(utterance);
  }

  private async announceDashboardEvent(event: DashboardEvent) {
    const name = `${event.user.firstName} ${event.user.lastName}`.trim() || event.user.username;
    const action = event.type === 'timeout' ? 'timed out' : 'timed in';
    const movement = event.type === 'timeout'
      ? `going to ${event.destination} for ${event.purpose}`
      : `returned from ${event.destination} for ${event.purpose}`;
    this.chimePromise = this.playAnnouncementChime();
    await this.speakAnnouncement(`${name} ${action} at ${this.formatAnnouncementTime()}, ${movement}.`);
  }

  private loadDashboard() {
    this.staffLocator.dashboard().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.error = ''; },
      error: () => { this.error = 'Unable to reach the Staff Locator server.'; },
    });
  }

  timeOut() {
    if (!this.session || !this.destination.trim() || !this.purpose.trim()) return;
    const timedOutAt = this.asIsoTime(this.timeoutDate, this.timeoutTime);
    if (!timedOutAt) { this.error = 'Use time out date MM/DD/YYYY and time hh:mm AM/PM.'; return; }
    this.staffLocator.timeOut(this.session.user.id, this.selectedCompanionIds.map(Number), this.selectedLocationIds[0] ?? null, this.destination, this.purpose, timedOutAt).subscribe({
      next: () => { this.message = 'Staff member timed out.'; this.manualDestination = ''; this.purpose = ''; this.selectedLocationIds = []; this.selectedCompanionIds = []; this.isManualDestination = false; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to time out staff member.'; },
    });
  }

  timeIn(visit: ActiveVisit) {
    const timedInAt = this.asIsoTime(this.timeinDate, this.timeinTime);
    if (!timedInAt) { this.error = 'Use time in date MM/DD/YYYY and time hh:mm AM/PM.'; return; }
    this.staffLocator.timeIn(visit.id, timedInAt).subscribe({
      next: () => { this.message = `${visit.user.username} is back in the office.`; this.refresh(); },
      error: () => { this.error = 'Unable to time in staff member.'; },
    });
  }

  timeInSelected() {
    const timedInAt = this.asIsoTime(this.timeinDate, this.timeinTime);
    if (!timedInAt) { this.error = 'Use time in date MM/DD/YYYY and time hh:mm AM/PM.'; return; }
    this.selectedReturnVisitIds.forEach((visitId) => {
      this.staffLocator.timeIn(visitId, timedInAt).subscribe({ next: () => this.refresh() });
    });
    this.selectedReturnVisitIds = [];
  }

  createUser() {
    this.staffLocator.createUser(this.newFirstName, this.newLastName, this.newUsername, this.newPassword).subscribe({
      next: () => { this.message = 'User created.'; this.newFirstName = ''; this.newLastName = ''; this.newUsername = ''; this.newPassword = ''; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to create user.'; },
    });
  }

  createLocation() {
    this.staffLocator.createLocation(this.newLocation).subscribe({
      next: () => { this.message = 'Location added.'; this.newLocation = ''; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to add location.'; },
    });
  }

  private refresh() { this.staffLocator.dashboard().subscribe((dashboard) => this.dashboard = dashboard); }

  formatTime(value: string | null | undefined) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'; }

}
