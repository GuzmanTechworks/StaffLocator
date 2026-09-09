"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("./prisma.service");
const rxjs_1 = require("rxjs");
const node_crypto_1 = require("node:crypto");
let AppService = class AppService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.dashboardEvents = new rxjs_1.Subject();
    }
    async login(username, password) {
        const user = await this.prisma.user.findUnique({ where: { username: username?.trim() } });
        if (!user || !(await bcryptjs_1.default.compare(password ?? '', user.password)))
            throw new common_1.NotFoundException('Invalid username or password.');
        const profile = { id: user.id, firstName: user.firstName, lastName: user.lastName, nickname: user.nickname, username: user.username, isAdmin: user.isAdmin };
        return { accessToken: await this.jwt.signAsync(profile), user: profile };
    }
    getHealth() {
        return { status: 'ok', service: 'staff-locator-api' };
    }
    async getDashboard() {
        const [locations, users, visits, history] = await Promise.all([
            this.prisma.location.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
            this.prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, nickname: true, username: true, isAdmin: true }, orderBy: { lastName: 'asc' } }),
            this.prisma.visit.findMany({
                where: { timedInAt: null },
                include: { user: { select: { id: true, firstName: true, lastName: true, nickname: true, username: true } }, location: true },
                orderBy: { timedOutAt: 'desc' },
            }),
            this.prisma.visit.findMany({
                where: { timedInAt: { not: null } },
                include: { user: { select: { id: true, firstName: true, lastName: true, nickname: true, username: true } }, location: true },
                orderBy: { timedInAt: 'desc' },
                take: 100,
            }),
        ]);
        return { locations, users, activeVisits: visits, history };
    }
    async createUser(firstName, lastName, nickname, username, password, isAdmin = false) {
        if (!firstName?.trim() || !lastName?.trim() || !nickname?.trim() || !username?.trim() || !password)
            throw new common_1.BadRequestException('First name, last name, nickname, username, and password are required.');
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        return this.prisma.user.create({ data: { firstName: firstName.trim(), lastName: lastName.trim(), nickname: nickname.trim(), username: username.trim(), password: passwordHash, isAdmin }, select: { id: true, firstName: true, lastName: true, nickname: true, username: true, isAdmin: true } });
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword || newPassword.length < 6)
            throw new common_1.BadRequestException('Current password and a new password of at least 6 characters are required.');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !(await bcryptjs_1.default.compare(currentPassword, user.password)))
            throw new common_1.BadRequestException('Current password is incorrect.');
        await this.prisma.user.update({ where: { id: userId }, data: { password: await bcryptjs_1.default.hash(newPassword, 10) } });
        return { message: 'Password changed.' };
    }
    async resetPassword(userId, newPassword) {
        if (!newPassword || newPassword.length < 6)
            throw new common_1.BadRequestException('New password must be at least 6 characters.');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        await this.prisma.user.update({ where: { id: userId }, data: { password: await bcryptjs_1.default.hash(newPassword, 10) } });
        return { message: 'Password reset.' };
    }
    async createLocation(name) {
        if (!name?.trim())
            throw new common_1.BadRequestException('Location name is required.');
        return this.prisma.location.create({ data: { name: name.trim() } });
    }
    async timeOut(userId, companionIds, locationId, destination, purpose, timedOutAt) {
        if (!destination?.trim() || !purpose?.trim())
            throw new common_1.BadRequestException('Destination and purpose are required.');
        const memberIds = [...new Set([userId, ...companionIds.map(Number)])];
        const timeOutDate = timedOutAt ? new Date(timedOutAt) : new Date();
        if (Number.isNaN(timeOutDate.getTime()))
            throw new common_1.BadRequestException('Invalid time out.');
        const [users, location, openVisits] = await Promise.all([
            this.prisma.user.findMany({ where: { id: { in: memberIds } } }),
            locationId ? this.prisma.location.findUnique({ where: { id: locationId, active: true } }) : null,
            this.prisma.visit.findMany({ where: { userId: { in: memberIds }, timedInAt: null } }),
        ]);
        const user = users.find((item) => item.id === userId);
        if (!user || users.length !== memberIds.length)
            throw new common_1.NotFoundException('One or more users were not found.');
        if (locationId && !location)
            throw new common_1.NotFoundException('Location not found.');
        if (openVisits.length)
            throw new common_1.BadRequestException('One or more selected users are already timed out.');
        const groupId = (0, node_crypto_1.randomUUID)();
        await this.prisma.visit.createMany({ data: memberIds.map((memberId) => ({ userId: memberId, groupId, locationId, destination: destination.trim(), purpose: purpose.trim(), timedOutAt: timeOutDate })) });
        this.dashboardEvents.next({
            type: 'timeout',
            users: memberIds.map((memberId) => users.find((item) => item.id === memberId)).map((item) => ({ firstName: item.firstName, lastName: item.lastName, nickname: item.nickname, username: item.username })),
            groupId,
            destination: destination.trim(),
            purpose: purpose.trim(),
        });
        return this.prisma.visit.findMany({ where: { groupId }, include: { user: true, location: true } });
    }
    async timeIn(visitId, timedInAt, remarks = '') {
        const existingVisit = await this.prisma.visit.findUnique({ where: { id: visitId }, include: { user: true } });
        if (!existingVisit)
            throw new common_1.NotFoundException('Visit not found.');
        if (existingVisit.timedInAt)
            throw new common_1.BadRequestException('This visit is already closed.');
        const timeInDate = timedInAt ? new Date(timedInAt) : new Date();
        if (Number.isNaN(timeInDate.getTime()))
            throw new common_1.BadRequestException('Invalid time in.');
        const visit = await this.prisma.visit.update({ where: { id: visitId }, data: { timedInAt: timeInDate, remarks: remarks.trim().slice(0, 255) }, include: { user: true, location: true } });
        const groupVisits = visit.groupId
            ? await this.prisma.visit.findMany({ where: { groupId: visit.groupId }, include: { user: true }, orderBy: { id: 'asc' } })
            : [visit];
        this.dashboardEvents.next({
            type: 'timein',
            users: groupVisits.map((item) => ({ firstName: item.user.firstName, lastName: item.user.lastName, nickname: item.user.nickname, username: item.user.username })),
            groupId: visit.groupId,
            destination: visit.destination,
            purpose: visit.purpose,
        });
        return visit;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AppService);
//# sourceMappingURL=app.service.js.map