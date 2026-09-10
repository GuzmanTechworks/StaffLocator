import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { HomePage } from '../home/home.page';
import { StaffLocatorService } from '../core/staff-locator.service';

@Component({ selector: 'app-change-password', templateUrl: './change-password.page.html', styleUrls: ['../shared/workspace.page.scss'], standalone: false })
export class ChangePasswordPage extends HomePage {
  constructor(staffLocator: StaffLocatorService, changeDetector: ChangeDetectorRef, router: Router) { super(staffLocator, changeDetector, router); }
}
