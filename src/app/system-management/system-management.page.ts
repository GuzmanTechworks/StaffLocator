import { ChangeDetectorRef, Component } from '@angular/core';
import { HomePage } from '../home/home.page';
import { StaffLocatorService } from '../core/staff-locator.service';

@Component({ selector: 'app-system-management', templateUrl: './system-management.page.html', styleUrls: ['../shared/workspace.page.scss'], standalone: false })
export class SystemManagementPage extends HomePage {
  constructor(staffLocator: StaffLocatorService, changeDetector: ChangeDetectorRef) { super(staffLocator, changeDetector); }
}
