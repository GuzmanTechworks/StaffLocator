import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { SystemManagementPage } from './system-management.page';
import { SystemManagementPageRoutingModule } from './system-management-routing.module';
@NgModule({ declarations: [SystemManagementPage], imports: [CommonModule, FormsModule, IonicModule, SystemManagementPageRoutingModule] })
export class SystemManagementPageModule {}
