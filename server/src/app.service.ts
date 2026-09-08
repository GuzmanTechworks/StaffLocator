import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { Subject } from 'rxjs';
import { randomUUID } from 'node:crypto';

export type DashboardEvent = {
  type: 'timeout' | 'timein';
  user: { firstName: string; lastName: string; username: string };
  destination: string;
  purpose: string;
};

@Injectable()
export class AppService {
  readonly dashboardEvents = new Subject<DashboardEvent>();

  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username?.trim() } });
    if (!user || !(await bcrypt.compare(password ?? '', user.password))) throw new NotFoundException('Invalid username or password.');
    const profile = { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, isAdmin: user.isAdmin };
    return { accessToken: await this.jwt.signAsync(profile), user: profile };
  }

  getHealth() {
    return { status: 'ok', service: 'staff-locator-api' };
  }

  async getDashboard() {
    const [locations, users, visits, history] = await Promise.all([
      this.prisma.location.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, username: true, isAdmin: true }, orderBy: { lastName: 'asc' } }),
      this.prisma.visit.findMany({
        where: { timedInAt: null },
        include: { user: { select: { id: true, firstName: true, lastName: true, username: true } }, location: true },
        orderBy: { timedOutAt: 'desc' },
      }),
      this.prisma.visit.findMany({
        where: { timedInAt: { not: null } },
        include: { user: { select: { id: true, firstName: true, lastName: true, username: true } }, location: true },
        orderBy: { timedInAt: 'desc' },
        take: 100,
      }),
    ]);

    return { locations, users, activeVisits: visits, history };
  }

  async createUser(firstName: string, lastName: string, username: string, password: string, isAdmin = false) {
    if (!firstName?.trim() || !lastName?.trim() || !username?.trim() || !password) throw new BadRequestException('First name, last name, username, and password are required.');
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(), password: passwordHash, isAdmin }, select: { id: true, firstName: true, lastName: true, username: true, isAdmin: true } });
  }

  async createLocation(name: string) {
    if (!name?.trim()) throw new BadRequestException('Location name is required.');
    return this.prisma.location.create({ data: { name: name.trim() } });
  }

  async timeOut(userId: number, companionIds: number[], locationId: number | null, destination: string, purpose: string, timedOutAt?: string) {
    if (!destination?.trim() || !purpose?.trim()) throw new BadRequestException('Destination and purpose are required.');
    const memberIds = [...new Set([userId, ...companionIds.map(Number)])];
    const timeOutDate = timedOutAt ? new Date(timedOutAt) : new Date();
    if (Number.isNaN(timeOutDate.getTime())) throw new BadRequestException('Invalid time out.');
    const [users, location, openVisits] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: memberIds } } }),
      locationId ? this.prisma.location.findUnique({ where: { id: locationId, active: true } }) : null,
      this.prisma.visit.findMany({ where: { userId: { in: memberIds }, timedInAt: null } }),
    ]);
    const user = users.find((item) => item.id === userId);
    if (!user || users.length !== memberIds.length) throw new NotFoundException('One or more users were not found.');
    if (locationId && !location) throw new NotFoundException('Location not found.');
    if (openVisits.length) throw new BadRequestException('One or more selected users are already timed out.');
    const groupId = randomUUID();
    await this.prisma.visit.createMany({ data: memberIds.map((memberId) => ({ userId: memberId, groupId, locationId, destination: destination.trim(), purpose: purpose.trim(), timedOutAt: timeOutDate })) });
    this.dashboardEvents.next({
      type: 'timeout',
      user: { firstName: user.firstName, lastName: user.lastName, username: user.username },
      destination: destination.trim(),
      purpose: purpose.trim(),
    });
    return this.prisma.visit.findMany({ where: { groupId }, include: { user: true, location: true } });
  }

  async timeIn(visitId: number, timedInAt?: string) {
    const existingVisit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!existingVisit) throw new NotFoundException('Visit not found.');
    if (existingVisit.timedInAt) throw new BadRequestException('This visit is already closed.');
    const timeInDate = timedInAt ? new Date(timedInAt) : new Date();
    if (Number.isNaN(timeInDate.getTime())) throw new BadRequestException('Invalid time in.');
    const visit = await this.prisma.visit.update({ where: { id: visitId }, data: { timedInAt: timeInDate }, include: { user: true, location: true } });
    this.dashboardEvents.next({
      type: 'timein',
      user: { firstName: visit.user.firstName, lastName: visit.user.lastName, username: visit.user.username },
      destination: visit.destination,
      purpose: visit.purpose,
    });
    return visit;
  }
}
