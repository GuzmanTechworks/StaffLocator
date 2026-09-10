import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StaffUser { id: number; firstName: string; lastName: string; nickname: string; username: string; isAdmin: boolean; }
export interface Location { id: number; name: string; active: boolean; }
export interface ActiveVisit {
  id: number;
  timedOutAt: string;
  timedInAt?: string | null;
  destination: string;
  purpose: string;
  groupId?: string | null;
  remarks: string;
  user: StaffUser;
  location: Location | null;
}
export interface DashboardData { users: StaffUser[]; locations: Location[]; activeVisits: ActiveVisit[]; history: ActiveVisit[]; }
export interface Session { accessToken: string; user: StaffUser; }
export interface DashboardEvent {
  type: 'timeout' | 'timein';
  users: Array<Pick<StaffUser, 'firstName' | 'lastName' | 'nickname' | 'username'>>;
  groupId: string | null;
  destination: string;
  purpose: string;
}

@Injectable({ providedIn: 'root' })
export class StaffLocatorService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/auth/login`, { username, password });
  }

  get session(): Session | null {
    const value = localStorage.getItem('staff-locator-session');
    return value ? JSON.parse(value) as Session : null;
  }

  set session(value: Session | null) {
    if (value) localStorage.setItem('staff-locator-session', JSON.stringify(value));
    else localStorage.removeItem('staff-locator-session');
  }

  get biometricEnabled(): boolean {
    return localStorage.getItem('staff-locator-biometric-enabled') === 'true';
  }

  set biometricEnabled(value: boolean) {
    if (value) localStorage.setItem('staff-locator-biometric-enabled', 'true');
    else localStorage.removeItem('staff-locator-biometric-enabled');
  }

  expireSession() {
    this.session = null;
  }

  private options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.session?.accessToken ?? ''}` }) };
  }

  dashboard(): Observable<DashboardData> { return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, this.options()); }
  dashboardEvents(): Observable<DashboardEvent> {
    return new Observable<DashboardEvent>((subscriber) => {
      const events = new EventSource(`${this.apiUrl}/dashboard/events`);
      events.onmessage = (event) => subscriber.next(JSON.parse(event.data) as DashboardEvent);
      events.onerror = () => {
        // EventSource reconnects automatically; do not terminate the observable
        // on transient stream errors, otherwise the UI falsely reports disconnection.
      };
      return () => events.close();
    });
  }
  timeOut(userId: number, companionIds: number[], locationId: number | null, destination: string, purpose: string) { return this.http.post(`${this.apiUrl}/visits/timeout`, { userId, companionIds, locationId, destination, purpose }, this.options()); }
  timeIn(visitId: number, timedInAt: string | undefined, remarks: string) { return this.http.patch(`${this.apiUrl}/visits/${visitId}/timein`, { timedInAt, remarks }, this.options()); }
  createUser(firstName: string, lastName: string, nickname: string, username: string, password: string, isAdmin = false) { return this.http.post(`${this.apiUrl}/users`, { firstName, lastName, nickname, username, password, isAdmin }, this.options()); }
  changePassword(currentPassword: string, newPassword: string) { return this.http.patch(`${this.apiUrl}/account/password`, { currentPassword, newPassword }, this.options()); }
  resetPassword(userId: number, newPassword: string) { return this.http.patch(`${this.apiUrl}/users/${userId}/password`, { newPassword }, this.options()); }
  createLocation(name: string) { return this.http.post(`${this.apiUrl}/locations`, { name }, this.options()); }
}
