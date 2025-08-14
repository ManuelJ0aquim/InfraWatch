"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePolicyForService = getActivePolicyForService;
exports.listPolicies = listPolicies;
exports.createPolicy = createPolicy;
const prisma_1 = require("../utils/prisma");
async function getActivePolicyForService(serviceId) {
    const prisma = (0, prisma_1.getPrisma)();
    const p = await prisma.slaPolicy.findFirst({ where: { serviceId, activeTo: null }, orderBy: { createdAt: "desc" } });
    return p;
}
async function listPolicies() {
    const prisma = (0, prisma_1.getPrisma)();
    return (await prisma.slaPolicy.findMany({}));
}
async function createPolicy(data) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.slaPolicy.create({ data: data });
}
//# sourceMappingURL=policyRepo.js.map