import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular/lazy';
import { HistoryPage } from './history.page';
import { HistoryPageRoutingModule } from './history-routing.module';
@NgModule({ declarations: [HistoryPage], imports: [CommonModule, IonicModule, HistoryPageRoutingModule] })
export class HistoryPageModule {}
