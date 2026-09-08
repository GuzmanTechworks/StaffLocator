import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StaffLocatorService } from '../core/staff-locator.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
  standalone: false,
})
export class SignInPage {
  username = '';
  password = '';
  error = '';
  isSubmitting = false;

  constructor(private readonly staffLocator: StaffLocatorService, private readonly router: Router) {}

  submit() {
    this.isSubmitting = true;
    this.error = '';
    this.staffLocator.login(this.username, this.password).subscribe({
      next: (session) => {
        this.staffLocator.session = session;
        this.router.navigateByUrl('/home');
      },
      error: (response) => {
        this.error = response.error?.message ?? 'Invalid username or password.';
        this.isSubmitting = false;
      },
    });
  }
}