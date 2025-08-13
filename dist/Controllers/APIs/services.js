"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllServices = getAllServices;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getAllServices() {
    return prisma.service.findMany({
        select: {
            id: true,
            name: true,
            type: true,
            target: true,
            status: true,
            checkEveryS: true,
        }
    });
}
