"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const administratorPassword = await bcryptjs_1.default.hash('isd.admin', 10);
    const userPassword = await bcryptjs_1.default.hash('ches', 10);
    await prisma.user.upsert({
        where: { username: 'isd.admin' },
        update: { firstName: 'ISD', lastName: 'Administrator', nickname: 'Admin', password: administratorPassword, isAdmin: true },
        create: { firstName: 'ISD', lastName: 'Administrator', nickname: 'Admin', username: 'isd.admin', password: administratorPassword, isAdmin: true },
    });
    await prisma.user.upsert({
        where: { username: 'ches' },
        update: { firstName: 'Aldwin Chester', lastName: 'Guzman', nickname: 'Chester', password: userPassword, isAdmin: false },
        create: { firstName: 'Aldwin Chester', lastName: 'Guzman', nickname: 'Chester', username: 'ches', password: userPassword, isAdmin: false },
    });
    for (const name of ['Main Office', 'Finance', 'Human Resources', 'IT Help Desk']) {
        await prisma.location.upsert({ where: { name }, update: {}, create: { name } });
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map