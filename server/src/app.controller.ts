import { Body, Controller, Get, MessageEvent, Param, ParseIntPipe, Patch, Post, Sse, UseGuards } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AppService, DashboardEvent } from './app.service';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root() { return this.appService.getHealth(); }

  @Get('health')
  health() { return this.appService.getHealth(); }

  @Post('auth/login')
  login(@Body() body: { username: string; password: string }) { return this.appService.login(body.username, body.password); }

  @Get('dashboard')
  dashboard() { return this.appService.getDashboard(); }

  @Sse('dashboard/events')
  dashboardEvents(): Observable<MessageEvent> {
    return this.appService.dashboardEvents.pipe(map((event: DashboardEvent) => ({ data: event })));
  }

  @Post('users')
  @UseGuards(AuthGuard, AdminGuard)
  createUser(@Body() body: { firstName: string; lastName: string; username: string; password: string; isAdmin?: boolean }) {
    return this.appService.createUser(body.firstName, body.lastName, body.username, body.password, body.isAdmin);
  }

  @Post('locations')
  @UseGuards(AuthGuard, AdminGuard)
  createLocation(@Body() body: { name: string }) { return this.appService.createLocation(body.name); }

  @Post('visits/timeout')
  @UseGuards(AuthGuard)
  timeOut(@Body() body: { userId: number; companionIds?: number[]; locationId?: number | null; destination: string; purpose: string; timedOutAt?: string }) {
    return this.appService.timeOut(Number(body.userId), body.companionIds ?? [], body.locationId ? Number(body.locationId) : null, body.destination, body.purpose, body.timedOutAt);
  }

  @Patch('visits/:id/timein')
  @UseGuards(AuthGuard)
  timeIn(@Param('id', ParseIntPipe) id: number, @Body() body: { timedInAt?: string }) { return this.appService.timeIn(id, body.timedInAt); }
}
