import { ChangeDetectorRef, Component } from '@angular/core';
import { HomePage } from '../home/home.page';
import { StaffLocatorService } from '../core/staff-locator.service';

@Component({ selector: 'app-history', templateUrl: './history.page.html', styleUrls: ['../shared/workspace.page.scss'], standalone: false })
export class HistoryPage extends HomePage {
  constructor(staffLocator: StaffLocatorService, changeDetector: ChangeDetectorRef) { super(staffLocator, changeDetector); }
}
