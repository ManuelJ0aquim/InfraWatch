"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertContactController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AlertContactController {
    async create(req, reply) {
        const { serviceId, channel, to } = req.body;
        if (!serviceId || !channel || !to) {
            return reply.status(400).send({ message: 'Campos obrigatórios ausentes.' });
        }
        try {
            const contact = await prisma.alertContact.create({
                data: { serviceId, channel, to },
            });
            return reply.status(201).send(contact);
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ message: 'Erro ao criar contato.' });
        }
    }
    async list(req, reply) {
        const { serviceId } = req.params;
        try {
            const contacts = await prisma.alertContact.findMany({
                where: { serviceId },
            });
            return reply.send(contacts);
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ message: 'Erro ao buscar contatos.' });
        }
    }
    // Atualizar um contato
    async update(req, reply) {
        const { id } = req.params;
        const { channel, to, active } = req.body;
        try {
            const contact = await prisma.alertContact.update({
                where: { id },
                data: { channel, to, active },
            });
            return reply.send(contact);
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ message: 'Erro ao atualizar contato.' });
        }
    }
    async delete(req, reply) {
        const { id } = req.params;
        try {
            await prisma.alertContact.delete({ where: { id } });
            return reply.send({ message: 'Contato removido com sucesso.' });
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ message: 'Erro ao remover contato.' });
        }
    }
}
exports.AlertContactController = AlertContactController;
