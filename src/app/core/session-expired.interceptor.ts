import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { StaffLocatorService } from './staff-locator.service';

@Injectable()
export class SessionExpiredInterceptor implements HttpInterceptor {
  constructor(
    private readonly staffLocator: StaffLocatorService,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.staffLocator.session) {
          this.staffLocator.expireSession();
          void this.router.navigateByUrl('/sign-in');
        }

        return throwError(() => error);
      }),
    );
  }
}
