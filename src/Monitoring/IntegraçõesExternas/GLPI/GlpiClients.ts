import { GLPIClient } from "@atno/ts-glpi-client";
import { PrismaClient, ServiceType } from "@prisma/client";

const prisma = new PrismaClient();

const client = new GLPIClient(
  process.env.GLPI_URL!,
  process.env.GLPI_APP_TOKEN!
);

let apiClient: any;

async function initGlpiSession() {
  try {
    apiClient = await client.authenticateWithToken(process.env.GLPI_USER_TOKEN!);
    console.log("Sessão GLPI iniciada.");
    return apiClient;
  } catch (error: any) {
    console.error("Erro ao iniciar sessão GLPI:", error);
    throw new Error(`Falha na autenticação GLPI: ${error.message}`);
  }
}

export async function syncGlpiInventory() {
  try {
    if (!apiClient) {
      await initGlpiSession();
    }

    const response = await apiClient.actives.getAll("Computer");
    const items = response?.data || response;

    if (!Array.isArray(items)) {
      throw new Error("GLPI não retornou uma lista de computadores.");
    }

    for (const item of items) {
      const owner = await prisma.user.findFirst();
      if (!owner) {
        console.warn("Nenhum usuário encontrado, serviço ficará sem dono!");
      }

      await prisma.service.upsert({
        where: { id: item.id.toString() },
        update: {
          name: item.name,
          target: item.ip ?? item.name ?? "desconhecido",
          type: ServiceType.PING,
          criticality: item.criticality ?? "medium",
          updatedAt: new Date(),
        },
        create: {
          id: item.id.toString(),
          name: item.name,
          target: item.ip ?? item.name ?? "desconhecido",
          type: ServiceType.PING,
          ownerId: owner?.id ?? undefined,
          criticality: item.criticality ?? "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log("Inventário GLPI sincronizado com sucesso.");
  } catch (error: any) {
    console.error("Erro ao sincronizar inventário GLPI:", error);
    throw new Error(`Falha na sincronização: ${error.message}`);
  }
}

export async function createGlpiTicket(serviceName: string, description: string, criticality: string) {
  try {
    if (!apiClient) await initGlpiSession();

    const ticketData = {
      name: `Falha no serviço: ${serviceName}`,
      content: description,
      urgency: criticality === "high" ? 5 : criticality === "medium" ? 3 : 1,
      impact: criticality === "high" ? 5 : criticality === "medium" ? 3 : 1,
      priority: criticality === "high" ? 5 : criticality === "medium" ? 3 : 1,
      entities_id: 0,
      type: 1,
    };

    const ticket = await apiClient.assistance.add("Ticket", ticketData);
    const ticketId = ticket.id || ticket.data?.id || ticket.input?.id;

    if (!ticketId) {
      throw new Error("ID do ticket não encontrado na resposta do GLPI");
    }

    console.log("Ticket criado no GLPI:", ticketId);
    return ticketId;
  } catch (error: any) {
    console.error("Erro ao criar ticket no GLPI:", error);
    throw new Error(`Falha ao criar ticket: ${error.message}`);
  }
}

export async function updateGlpiTicket(ticketId: number, updateData: { content: string }) {
  try {
    if (!apiClient) await initGlpiSession();

    const updatedTicket = await apiClient.updateItem("Ticket", ticketId, updateData);
    console.log("Ticket atualizado no GLPI:", ticketId);
    return updatedTicket;
  } catch (error: any) {
    console.error("Erro ao atualizar ticket no GLPI:", error);
    throw new Error(`Falha ao atualizar ticket: ${error.message}`);
  }
}

export { apiClient };
