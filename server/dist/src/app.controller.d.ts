import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    root(): {
        status: string;
        service: string;
    };
    health(): {
        status: string;
        service: string;
    };
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: number;
            firstName: string;
            lastName: string;
            username: string;
            isAdmin: boolean;
        };
    }>;
    dashboard(): Promise<{
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
    dashboardEvents(): Observable<MessageEvent>;
    createUser(body: {
        firstName: string;
        lastName: string;
        username: string;
        password: string;
        isAdmin?: boolean;
    }): Promise<{
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        isAdmin: boolean;
    }>;
    createLocation(body: {
        name: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        name: string;
        active: boolean;
    }>;
    timeOut(body: {
        userId: number;
        locationId?: number | null;
        destination: string;
        purpose: string;
    }): Promise<{
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
    timeIn(id: number): Promise<{
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
