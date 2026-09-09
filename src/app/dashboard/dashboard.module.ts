import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { DashboardPage } from './dashboard.page';
import { DashboardPageRoutingModule } from './dashboard-routing.module';

@NgModule({ declarations: [DashboardPage], imports: [CommonModule, FormsModule, IonicModule, DashboardPageRoutingModule] })
export class DashboardPageModule {}
