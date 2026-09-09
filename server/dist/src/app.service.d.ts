import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { Subject } from 'rxjs';
export type DashboardEvent = {
    type: 'timeout' | 'timein';
    users: Array<{
        firstName: string;
        lastName: string;
        nickname: string;
        username: string;
    }>;
    groupId: string | null;
    destination: string;
    purpose: string;
};
export declare class AppService {
    private readonly prisma;
    private readonly jwt;
    readonly dashboardEvents: Subject<DashboardEvent>;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(username: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: number;
            firstName: string;
            lastName: string;
            nickname: string;
            username: string;
            isAdmin: boolean;
        };
    }>;
    getHealth(): {
        status: string;
        service: string;
    };
    getDashboard(): Promise<{
        locations: {
            id: number;
            createdAt: Date;
            name: string;
            active: boolean;
        }[];
        users: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            nickname: string;
            isAdmin: boolean;
        }[];
        activeVisits: ({
            user: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
                nickname: string;
            };
            location: {
                id: number;
                createdAt: Date;
                name: string;
                active: boolean;
            } | null;
        } & {
            id: number;
            userId: number;
            locationId: number | null;
            destination: string;
            purpose: string;
            timedOutAt: Date;
            timedInAt: Date | null;
            groupId: string | null;
            remarks: string;
        })[];
        history: ({
            user: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
                nickname: string;
            };
            location: {
                id: number;
                createdAt: Date;
                name: string;
                active: boolean;
            } | null;
        } & {
            id: number;
            userId: number;
            locationId: number | null;
            destination: string;
            purpose: string;
            timedOutAt: Date;
            timedInAt: Date | null;
            groupId: string | null;
            remarks: string;
        })[];
    }>;
    createUser(firstName: string, lastName: string, nickname: string, username: string, password: string, isAdmin?: boolean): Promise<{
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        nickname: string;
        isAdmin: boolean;
    }>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    resetPassword(userId: number, newPassword: string): Promise<{
        message: string;
    }>;
    createLocation(name: string): Promise<{
        id: number;
        createdAt: Date;
        name: string;
        active: boolean;
    }>;
    timeOut(userId: number, companionIds: number[], locationId: number | null, destination: string, purpose: string, timedOutAt?: string): Promise<({
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            nickname: string;
            password: string;
            isAdmin: boolean;
            createdAt: Date;
        };
        location: {
            id: number;
            createdAt: Date;
            name: string;
            active: boolean;
        } | null;
    } & {
        id: number;
        userId: number;
        locationId: number | null;
        destination: string;
        purpose: string;
        timedOutAt: Date;
        timedInAt: Date | null;
        groupId: string | null;
        remarks: string;
    })[]>;
    timeIn(visitId: number, timedInAt?: string, remarks?: string): Promise<{
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            nickname: string;
            password: string;
            isAdmin: boolean;
            createdAt: Date;
        };
        location: {
            id: number;
            createdAt: Date;
            name: string;
            active: boolean;
        } | null;
    } & {
        id: number;
        userId: number;
        locationId: number | null;
        destination: string;
        purpose: string;
        timedOutAt: Date;
        timedInAt: Date | null;
        groupId: string | null;
        remarks: string;
    }>;
}
