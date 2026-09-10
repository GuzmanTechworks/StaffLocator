import { inject, NgModule } from '@angular/core';
import { CanActivateFn, PreloadAllModules, Router, RouterModule, Routes } from '@angular/router';
import { StaffLocatorService } from './core/staff-locator.service';

const authGuard: CanActivateFn = () => {
  const staffLocator = inject(StaffLocatorService);

  if (staffLocator.session) {
    return true;
  }

  return inject(Router).createUrlTree(['/sign-in']);
};

const routes: Routes = [
  {
    path: 'home',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule)
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadChildren: () => import('./history/history.module').then(m => m.HistoryPageModule)
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadChildren: () => import('./change-password/change-password.module').then(m => m.ChangePasswordPageModule)
  },
  {
    path: 'system-management',
    canActivate: [authGuard],
    loadChildren: () => import('./system-management/system-management.module').then(m => m.SystemManagementPageModule)
  },
  {
    path: 'sign-in',
    loadChildren: () => import('./sign-in/sign-in.module').then( m => m.SignInPageModule)
  },
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
