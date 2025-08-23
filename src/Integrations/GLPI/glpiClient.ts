
import { GLPIClient } from '@atno/ts-glpi-client';
import dotenv from 'dotenv';
import { PrismaClient, ServiceType, Role } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Cria o cliente GLPI
const client = new GLPIClient(
  process.env.GLPI_URL!,
  process.env.GLPI_APP_TOKEN!
);

// Mantém o apiClient globalmente se quiser evitar múltiplas autenticações
let apiClient: any;

async function initGlpiSession() {
  try {
    apiClient = await client.authenticateWithToken(process.env.GLPI_USER_TOKEN!);
    console.log('Sessão GLPI iniciada.');
  } catch (error: any) {
    console.error('Erro ao iniciar sessão GLPI:', error);
    throw new Error(`Falha na autenticação GLPI: ${error.message}`);
  }
}

// Função para garantir um usuário default
async function getOrCreateDefaultUser() {
  let defaultUser = await prisma.user.findUnique({
    where: { id: 'default' }, // Ou use um ID existente, ex: '1'
  });

  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        id: 'default', // Ou use autoincrement se id for Int
        name: 'Default User',
        email: 'default@example.com',
        password: 'defaultpassword', // Hash isso em produção
        role: Role.USER, // Use enum Role do schema
      },
    });
    console.log('Usuário default criado:', defaultUser.id);
  }
  return defaultUser.id;
}

export async function syncGlpiInventory() {
  try {
    if (!apiClient) {
      await initGlpiSession();
    }

    const response = await apiClient.actives.getAll('Computer') ; // ou outro tipo de item
    const items = response.data;
    const defaultOwnerId = await getOrCreateDefaultUser();
    console.log('Itens recebidos do GLPI:', items);

    if (!Array.isArray(items)) {
      throw new Error('GLPI não retornou uma lista de computadores.');
    }

    for (const item of items) {
      await prisma.service.upsert({
        where: { id: item.id.toString() },
        update: {
          name: item.name,
          target: item.ip || item.name,
          type: ServiceType.PING,
          criticality: item.criticality || 'medium',
        },
        create: {
          id: item.id.toString(),
          name: item.name,
          target: item.ip || item.name,
          type: ServiceType.PING,
          ownerId: defaultOwnerId,
          criticality: item.criticality || 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log('Inventário GLPI sincronizado com sucesso.');
  } catch (error: any) {
    console.error('Erro ao sincronizar inventário GLPI:', error);
    throw new Error(`Falha na sincronização: ${error.message}`);
  }
}

export async function createGlpiTicket(serviceName: string, description: string, criticality: string) {
  try {
    const sessionToken = await initGlpiSession();
    const ticketData = {
      name: `Falha no serviço: ${serviceName}`,
      content: description,
      urgency: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1, // Mapeia criticidade
      impact: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1,
      priority: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1,
      entities_id: 0, // Ajuste para a entidade desejada no GLPI
      type: 1, // 1 = Incidente, 2 = Requisição
    };
    const ticket = await apiClient.assistance.add('Ticket', ticketData, { sessionToken });
    //console.log('Resposta completa do GLPI:', JSON.stringify(ticket, null, 2));
    const ticketId = ticket.id || ticket.data?.id || ticket.input?.id; // Tenta diferentes propriedades
    if (!ticketId) {
      throw new Error('ID do ticket não encontrado na resposta do GLPI');
    }
    console.log('Ticket criado no GLPI:', ticketId);
    return ticketId;
  } catch (error) {
    console.error('Erro ao criar ticket no GLPI:', error);
    throw new Error(`Falha ao criar ticket: ${error.message}`);
  }
}

export async function updateGlpiTicket(ticketId: number, updateData: { content: string }) {
  try {
    const sessionToken = await initGlpiSession();
    const updatedTicket = await apiClient.updateItem('Ticket', ticketId, updateData, { sessionToken });
    console.log('Ticket atualizado no GLPI:', ticketId);
    return updatedTicket;
  } catch (error) {
    console.error('Erro ao atualizar ticket no GLPI:', error);
    throw new Error(`Falha ao atualizar ticket: ${error.message}`);
  }
}

export { apiClient }; // Exporta o cliente para uso em outros módulos