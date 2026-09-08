import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { Subject } from 'rxjs';
export declare class AppService {
    private readonly prisma;
    private readonly jwt;
    readonly dashboardEvents: Subject<void>;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(username: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: number;
            firstName: string;
            lastName: string;
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
            isAdmin: boolean;
        }[];
        activeVisits: ({
            user: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
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
        })[];
        history: ({
            user: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
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
        })[];
    }>;
    createUser(firstName: string, lastName: string, username: string, password: string, isAdmin?: boolean): Promise<{
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        isAdmin: boolean;
    }>;
    createLocation(name: string): Promise<{
        id: number;
        createdAt: Date;
        name: string;
        active: boolean;
    }>;
    timeOut(userId: number, locationId: number | null, destination: string, purpose: string): Promise<{
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
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
    }>;
    timeIn(visitId: number): Promise<{
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
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
    }>;
}
