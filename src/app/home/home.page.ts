import { Directive, HostListener, ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { IonInput } from '@ionic/angular';
import { interval } from 'rxjs';
import { ActiveVisit, DashboardData, DashboardEvent, StaffLocatorService } from '../core/staff-locator.service';

@Directive()
export class HomePage {
  dashboard: DashboardData = { users: [], locations: [], activeVisits: [], history: [] };
  selectedUserId: number | null = null;
  selectedLocationIds: number[] = [];
  selectedCompanionIds: number[] = [];
  selectedReturnVisitIds: number[] = [];
  isManualDestination = false;
  manualDestination = '';
  locationSearch = '';
  destinationPickerOpen = false;
  sidebarOpen = false;
  sidebarCollapsed = false;
  remarks = '';
  purpose = '';
  newFirstName = '';
  newLastName = '';
  newNickname = '';
  newUsername = '';
  newPassword = '';
  currentPassword = '';
  changePasswordValue = '';
  resetUserId: number | null = null;
  resetPasswordValue = '';
  newLocation = '';
  message = '';
  error = '';
  currentTime = this.formatCurrentTime();
  currentDate = this.formatCurrentDate();
  isDarkMode = localStorage.getItem('staff-locator-theme') === 'dark';
  @ViewChild('manualDestinationInput') private manualDestinationInput?: IonInput;
  private notificationAudioUnlocked = false;
  private notificationAudioContext?: AudioContext;
  private readonly announcementChimePath = 'assets/audio/announcement-chime.mp3';
  private readonly announcedGroupEvents = new Set<string>();
  private announcementQueue: Promise<void> = Promise.resolve();

  constructor(private readonly staffLocator: StaffLocatorService, private readonly changeDetector: ChangeDetectorRef) {
    this.applyTheme();
    interval(1000).subscribe(() => {
      this.currentTime = this.formatCurrentTime();
      this.currentDate = this.formatCurrentDate();
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

  get availableCompanions() {
    return this.dashboard.users.filter((user) => user.id !== this.session?.user.id && !user.isAdmin);
  }

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
    this.tryUnlockNotificationAudio();
  }

  private forceUnlockNotificationAudio() {
    this.tryUnlockNotificationAudio(true);
  }

  private tryUnlockNotificationAudio(force = false) {
    if (!force && this.notificationAudioUnlocked) return;

    this.notificationAudioUnlocked = true;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      this.notificationAudioContext ??= new AudioContextClass();
      if (this.notificationAudioContext.state === 'suspended') {
        void this.notificationAudioContext.resume();
      }
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

  toggleLocation(locationId: number | 'manual') {
    if (locationId === 'manual') {
      this.isManualDestination = !this.isManualDestination;
      if (!this.isManualDestination) this.manualDestination = '';
      if (this.isManualDestination) window.setTimeout(() => void this.manualDestinationInput?.setFocus());
      return;
    }
    this.selectedLocationIds = this.selectedLocationIds.includes(locationId)
      ? this.selectedLocationIds.filter((id) => id !== locationId)
      : [...this.selectedLocationIds, locationId];
  }

  openDestinationPicker() { this.destinationPickerOpen = true; }

  closeDestinationPicker() { this.destinationPickerOpen = false; }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() { this.sidebarOpen = false; }

  logout() { this.closeSidebar(); this.staffLocator.session = null; this.dashboard = { users: [], locations: [], activeVisits: [], history: [] }; }

  ionViewDidEnter() {
    this.loadDashboard();
    this.staffLocator.dashboardEvents().subscribe({
      next: (event) => { this.refresh(); void this.announceDashboardEvent(event); },
    });
  }

  private formatCurrentTime() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

  private formatCurrentDate() { return new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

  formatDate(value: string | null | undefined) { return value ? new Date(value).toLocaleDateString() : '-'; }

  private formatAnnouncementTime() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  private formatAnnouncementDestination(destination: string) {
    const destinations = destination
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (destinations.length <= 1) return destinations[0] ?? destination.trim();
    if (destinations.length === 2) return `${destinations[0]} and ${destinations[1]}`;
    return `${destinations.slice(0, -1).join(', ')}, and ${destinations[destinations.length - 1]}`;
  }

  private async playAnnouncementChime() {
    try {
      this.unlockNotificationAudio();

      const chime = new Audio(this.announcementChimePath);
      chime.preload = 'auto';
      chime.volume = 1;
      chime.currentTime = 0;

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          chime.removeEventListener('ended', onEnded);
          chime.removeEventListener('error', onError);
          resolve();
        };
        const onEnded = () => cleanup();
        const onError = () => cleanup();

        chime.addEventListener('ended', onEnded, { once: true });
        chime.addEventListener('error', onError, { once: true });

        void chime.play().catch(() => cleanup());
      });
    } catch {
      // Speech still provides the notification when audio is unavailable.
    }
  }

  private async speakAnnouncement(announcement: string) {
    if (!('speechSynthesis' in window)) return;

    const speech = window.speechSynthesis;
    speech.cancel();
    speech.resume();

    const utterance = new SpeechSynthesisUtterance(announcement);

    const pickFemaleVoice = () => {
      const voices = speech.getVoices();
      const femaleVoice = voices.find((voice) => /zira|jenny|samantha|victoria|ava|hazel|female/i.test(`${voice.name} ${voice.voiceURI}`))
        ?? voices.find((voice) => /^en-(US|GB|AU|CA)\b/i.test(voice.lang) && /zira|jenny|samantha|victoria|ava|hazel|female/i.test(`${voice.name} ${voice.voiceURI}`));

      return femaleVoice ?? null;
    };

    let preferredVoice = pickFemaleVoice();

    if (!preferredVoice) {
      await new Promise<void>((resolve) => {
        const onVoicesChanged = () => {
          preferredVoice = pickFemaleVoice();
          if (preferredVoice) {
            speech.removeEventListener('voiceschanged', onVoicesChanged);
            resolve();
          }
        };

        speech.addEventListener('voiceschanged', onVoicesChanged, { once: true });
        const fallbackVoices = speech.getVoices();
        if (fallbackVoices.length > 0) {
          preferredVoice = pickFemaleVoice();
          if (preferredVoice) {
            speech.removeEventListener('voiceschanged', onVoicesChanged);
            resolve();
          }
        }
      });
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.pitch = 1;
    utterance.rate = 0.88;
    utterance.volume = 1;

    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speech.speak(utterance);
    });
  }

  private async announceDashboardEvent(event: DashboardEvent) {
    if (!this.session?.user?.isAdmin) return;

    this.forceUnlockNotificationAudio();

    if (event.groupId) {
      const eventKey = `${event.type}:${event.groupId}`;
      if (this.announcedGroupEvents.has(eventKey)) return;
      this.announcedGroupEvents.add(eventKey);
    }

    const task = async () => {
      const names = event.users.map((user) => this.announcementName(user));
      const name = names.length > 1 ? `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}` : names[0];
      const action = event.type === 'timeout' ? 'timed out' : 'timed in';
      const destination = this.formatAnnouncementDestination(event.destination);
      const movement = event.type === 'timeout'
        ? `going to ${destination} for ${event.purpose}`
        : `went to ${destination}`;

      await this.playAnnouncementChime();
      await this.speakAnnouncement(`${name} ${action} at ${this.formatAnnouncementTime()}, ${movement}.`);
    };

    this.announcementQueue = this.announcementQueue.then(task, task);
    await this.announcementQueue;
  }

  private announcementName(user: DashboardEvent['users'][number]) {
    const nickname = user.nickname.trim();
    return nickname.toLowerCase() === 'ches' ? 'Chess' : nickname || `${user.firstName} ${user.lastName}`.trim() || user.username;
  }

  private loadDashboard() {
    this.staffLocator.dashboard().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.error = ''; },
      error: () => { this.error = 'Unable to reach the Staff Locator server.'; },
    });
  }

  timeOut() {
    if (!this.session || !this.destination.trim() || !this.purpose.trim()) return;
    this.staffLocator.timeOut(this.session.user.id, this.selectedCompanionIds.map(Number), this.selectedLocationIds[0] ?? null, this.destination, this.purpose).subscribe({
      next: () => { this.message = 'Staff member timed out.'; this.manualDestination = ''; this.purpose = ''; this.selectedLocationIds = []; this.selectedCompanionIds = []; this.isManualDestination = false; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to time out staff member.'; },
    });
  }

  timeIn(visit: ActiveVisit) {
    this.staffLocator.timeIn(visit.id, undefined, this.remarks).subscribe({
      next: () => { this.message = `${visit.user.username} is back in the office.`; this.refresh(); },
      error: () => { this.error = 'Unable to time in staff member.'; },
    });
  }

  selectAllReturnVisits() {
    this.selectedReturnVisitIds = this.returnGroupVisits.map((visit) => visit.id);
  }

  timeInSelected() {
    this.selectedReturnVisitIds.forEach((visitId) => {
      this.staffLocator.timeIn(visitId, undefined, this.remarks.trim()).subscribe({
        next: () => this.refresh(),
        error: (response) => { this.error = response.error?.message ?? 'Unable to time in selected staff.'; },
      });
    });
    this.selectedReturnVisitIds = [];
    this.remarks = '';
  }

  createUser() {
    this.message = ''; this.error = '';
    this.staffLocator.createUser(this.newFirstName, this.newLastName, this.newNickname, this.newUsername, this.newPassword).subscribe({
      next: () => { this.message = 'User created.'; this.newFirstName = ''; this.newLastName = ''; this.newNickname = ''; this.newUsername = ''; this.newPassword = ''; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to create user.'; },
    });
  }

  createLocation() {
    this.message = ''; this.error = '';
    this.staffLocator.createLocation(this.newLocation).subscribe({
      next: () => { this.message = 'Location added.'; this.newLocation = ''; this.refresh(); },
      error: (response) => { this.error = response.error?.message ?? 'Unable to add location.'; },
    });
  }

  changePassword() {
    this.message = ''; this.error = '';
    this.staffLocator.changePassword(this.currentPassword, this.changePasswordValue).subscribe({
      next: () => { this.message = 'Password changed.'; this.currentPassword = ''; this.changePasswordValue = ''; },
      error: (response) => { this.error = response.error?.message ?? 'Unable to change password.'; },
    });
  }

  resetPassword() {
    if (!this.resetUserId) return;
    this.message = ''; this.error = '';
    this.staffLocator.resetPassword(this.resetUserId, this.resetPasswordValue).subscribe({
      next: () => { this.message = 'User password reset.'; this.resetUserId = null; this.resetPasswordValue = ''; },
      error: (response) => { this.error = response.error?.message ?? 'Unable to reset password.'; },
    });
  }

  private refresh() { this.staffLocator.dashboard().subscribe((dashboard) => this.dashboard = dashboard); }

  formatTime(value: string | null | undefined) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'; }

}
