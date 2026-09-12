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
    appUpdate(): {
        latestVersion: string;
        downloadUrl: string;
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
            nickname: string;
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
    changePassword(request: {
        user: {
            id: number;
        };
    }, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    dashboardEvents(): Observable<MessageEvent>;
    createUser(body: {
        firstName: string;
        lastName: string;
        nickname: string;
        username: string;
        password: string;
        isAdmin?: boolean;
    }): Promise<{
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        nickname: string;
        isAdmin: boolean;
    }>;
    resetPassword(id: number, body: {
        newPassword: string;
    }): Promise<{
        message: string;
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
        companionIds?: number[];
        locationId?: number | null;
        destination: string;
        purpose: string;
        timedOutAt?: string;
    }): Promise<({
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            nickname: string;
            password: string;
            phoneNumber: string;
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
    timeIn(id: number, body: {
        timedInAt?: string;
        remarks?: string;
    }): Promise<{
        user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            nickname: string;
            password: string;
            phoneNumber: string;
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
