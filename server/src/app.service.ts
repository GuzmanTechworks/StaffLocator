import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { Subject } from 'rxjs';

@Injectable()
export class AppService {
  readonly dashboardEvents = new Subject<void>();

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

  async timeOut(userId: number, locationId: number | null, destination: string, purpose: string) {
    if (!destination?.trim() || !purpose?.trim()) throw new BadRequestException('Destination and purpose are required.');
    const [user, location, openVisit] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      locationId ? this.prisma.location.findUnique({ where: { id: locationId, active: true } }) : null,
      this.prisma.visit.findFirst({ where: { userId, timedInAt: null } }),
    ]);
    if (!user) throw new NotFoundException('User not found.');
    if (locationId && !location) throw new NotFoundException('Location not found.');
    if (openVisit) throw new BadRequestException('This user is already timed out.');
    const visit = await this.prisma.visit.create({ data: { userId, locationId, destination: destination.trim(), purpose: purpose.trim() }, include: { user: true, location: true } });
    this.dashboardEvents.next();
    return visit;
  }

  async timeIn(visitId: number) {
    const existingVisit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!existingVisit) throw new NotFoundException('Visit not found.');
    if (existingVisit.timedInAt) throw new BadRequestException('This visit is already closed.');
    const visit = await this.prisma.visit.update({ where: { id: visitId }, data: { timedInAt: new Date() }, include: { user: true, location: true } });
    this.dashboardEvents.next();
    return visit;
  }
}
