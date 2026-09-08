import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StaffUser { id: number; firstName: string; lastName: string; username: string; isAdmin: boolean; }
export interface Location { id: number; name: string; active: boolean; }
export interface ActiveVisit {
  id: number;
  timedOutAt: string;
  timedInAt?: string | null;
  destination: string;
  purpose: string;
  user: StaffUser;
  location: Location | null;
}
export interface DashboardData { users: StaffUser[]; locations: Location[]; activeVisits: ActiveVisit[]; history: ActiveVisit[]; }
export interface Session { accessToken: string; user: StaffUser; }

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

  private options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.session?.accessToken ?? ''}` }) };
  }

  dashboard(): Observable<DashboardData> { return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, this.options()); }
  dashboardEvents(): Observable<void> {
    return new Observable<void>((subscriber) => {
      const events = new EventSource(`${this.apiUrl}/dashboard/events`);
      events.onmessage = () => subscriber.next();
      events.onerror = (error) => subscriber.error(error);
      return () => events.close();
    });
  }
  timeOut(userId: number, locationId: number | null, destination: string, purpose: string) { return this.http.post(`${this.apiUrl}/visits/timeout`, { userId, locationId, destination, purpose }, this.options()); }
  timeIn(visitId: number) { return this.http.patch(`${this.apiUrl}/visits/${visitId}/timein`, {}, this.options()); }
  createUser(firstName: string, lastName: string, username: string, password: string, isAdmin = false) { return this.http.post(`${this.apiUrl}/users`, { firstName, lastName, username, password, isAdmin }, this.options()); }
  createLocation(name: string) { return this.http.post(`${this.apiUrl}/locations`, { name }, this.options()); }
}
