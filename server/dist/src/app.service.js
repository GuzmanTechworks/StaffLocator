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
    async createUser(firstName, lastName, username, password, isAdmin = false) {
        if (!firstName?.trim() || !lastName?.trim() || !username?.trim() || !password)
            throw new common_1.BadRequestException('First name, last name, username, and password are required.');
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        return this.prisma.user.create({ data: { firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(), password: passwordHash, isAdmin }, select: { id: true, firstName: true, lastName: true, username: true, isAdmin: true } });
    }
    async createLocation(name) {
        if (!name?.trim())
            throw new common_1.BadRequestException('Location name is required.');
        return this.prisma.location.create({ data: { name: name.trim() } });
    }
    async timeOut(userId, locationId, destination, purpose) {
        if (!destination?.trim() || !purpose?.trim())
            throw new common_1.BadRequestException('Destination and purpose are required.');
        const [user, location, openVisit] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            locationId ? this.prisma.location.findUnique({ where: { id: locationId, active: true } }) : null,
            this.prisma.visit.findFirst({ where: { userId, timedInAt: null } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        if (locationId && !location)
            throw new common_1.NotFoundException('Location not found.');
        if (openVisit)
            throw new common_1.BadRequestException('This user is already timed out.');
        const visit = await this.prisma.visit.create({ data: { userId, locationId, destination: destination.trim(), purpose: purpose.trim() }, include: { user: true, location: true } });
        this.dashboardEvents.next({
            type: 'timeout',
            user: { firstName: user.firstName, lastName: user.lastName, username: user.username },
            destination: visit.destination,
            purpose: visit.purpose,
        });
        return visit;
    }
    async timeIn(visitId) {
        const existingVisit = await this.prisma.visit.findUnique({ where: { id: visitId } });
        if (!existingVisit)
            throw new common_1.NotFoundException('Visit not found.');
        if (existingVisit.timedInAt)
            throw new common_1.BadRequestException('This visit is already closed.');
        const visit = await this.prisma.visit.update({ where: { id: visitId }, data: { timedInAt: new Date() }, include: { user: true, location: true } });
        this.dashboardEvents.next({
            type: 'timein',
            user: { firstName: visit.user.firstName, lastName: visit.user.lastName, username: visit.user.username },
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