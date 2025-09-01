
import { GLPIClient } from '@atno/ts-glpi-client';
import dotenv from 'dotenv';
import { PrismaClient, ServiceType, Role } from '@prisma/client';
import axios from 'axios';
import 'dotenv/config';

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

// export async function syncGlpiInventory() {
//   try {
//     if (!apiClient) {
//       await initGlpiSession();
//     }

//     const response = await apiClient.actives.getAll('Computer') ; // ou outro tipo de item
//     const items = response.data;
//     const defaultOwnerId = await getOrCreateDefaultUser();
//     console.log('Itens recebidos do GLPI:', items);

//     if (!Array.isArray(items)) {
//       throw new Error('GLPI não retornou uma lista de computadores.');
//     }

//     for (const item of items) {
//       await prisma.service.upsert({
//         where: { id: item.id.toString() },
//         update: {
//           name: item.name,
//           target: item.ip || item.name,
//           type: ServiceType.PING,
//           criticality: item.criticality || 'medium',
//         },
//         create: {
//           id: item.id.toString(),
//           name: item.name,
//           target: item.ip || item.name,
//           type: ServiceType.PING,
//           ownerId: defaultOwnerId,
//           criticality: item.criticality || 'medium',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         },
//       });
//     }

//     console.log('Inventário GLPI sincronizado com sucesso.');
//   } catch (error: any) {
//     console.error('Erro ao sincronizar inventário GLPI:', error);
//     throw new Error(`Falha na sincronização: ${error.message}`);
//   }
// }

const GLPI_INVENTORY_URL = process.env.GLPI_INVENTORY_URL || 'http://localhost:8080/front/inventory.php';
const GLPI_AGENT_TOKEN = process.env.GLPI_AGENT_TOKEN;
const INFRAWATCH_API_URL = 'http://localhost:3002/api';

export async function syncGlpiInventory() {
  // Validate environment variables
  if (!GLPI_INVENTORY_URL || !GLPI_AGENT_TOKEN) {
    console.error('GLPI inventory configuration is incomplete');
    return;
  }

  try {
    // Fetch all services
    const servicesResponse = await axios.get(`${INFRAWATCH_API_URL}/services`, {
      headers: { accept: 'application/json' },
    });
    const services = servicesResponse.data;

    for (const service of services) {
      // Fetch metrics for HTTP services
      let metrics = {};
      if (service.type === 'HTTP') {
        try {
          const metricsResponse = await axios.get(`${INFRAWATCH_API_URL}/services/${service.id}/metrics/http`, {
            headers: { accept: 'application/json' },
          });
          metrics = metricsResponse.data[0] || {};
        } catch (error) {
          console.error(`Failed to fetch metrics for service ${service.id}:`, error.message);
        }
      }
      if (service.type === 'SNMP') {
        try {
          const snmpMetrics = await axios.get(`${INFRAWATCH_API_URL}/services/${service.id}/metrics/snmp`);
          metrics = { ...metrics, ...snmpMetrics.data[0] };
        } catch (error) {
          console.error(`Falha ao buscar métricas SNMP para ${service.id}:`, error.message);
        }
      }

      // Map service type to GLPI asset type
      const assetTypeMap: { [key: string]: string } = {
        HTTP: 'Computer',
        PING: 'Computer',
        SNMP: 'NetworkEquipment',
      };
      const glpiAssetType = assetTypeMap[service.type] || 'Computer';

      // Generate GLPI inventory JSON
      const inventoryJson = {
        //_tracking_inventory: 1,
        deviceid: `infrawatch-${service.id}`,
        content: {
          versionclient: '1.0',
          hardware: {
            name: service.name || 'Unknown Asset',
            uuid: `infrawatch-${service.id}`,
            memory_size: metrics.memory || 0,
            cpu_names: metrics.cpu || "Desconhecido",
            serial: `INFRAWATCH-${service.id}`, // Adicionado para unicidade
            entities_id: 0, // Ajuste conforme a entidade do GLPI
            // Add more hardware fields if metrics provide them (e.g., memory_size, cpu_name)
          },
          os: {
            full_name: service.type === 'SNMP' ? 'Network OS' : 'Unknown OS',
            version: 'N/A',
          },
          networks: [
            {
              description: `Service Target: ${service.name}`,
              ipaddress: metrics.ip || (service.target.includes('://') ? service.target.split('://')[1].split('/')[0] : service.target),
              mac: metrics.mac || '', // Add if available from metrics
            },
          ],
          softwares: [
            {
              name: service.name,
              version: metrics.packageVersion ||'N/A',
              comment: `Service Type: ${service.type}, Status: ${metrics.status || 'Unknown'}`,
            },
          ],
          // Add virtualmachines if your services include VMs/containers
          "virtualmachines": [
            {
              "name": service.name,
              "uuid": `vm-${service.id}`,
              "comment": `Tipo de Serviço: ${service.type}`
            }
          ],
        },
        deviceid: `infrawatch-${service.id}`,
        tag: 'infrawatch-auto',
      };

      // Push to GLPI
      try {
        const response = await axios.post(GLPI_INVENTORY_URL, inventoryJson, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLPI_AGENT_TOKEN}`,
          },
        });

        if (response.status !== 200) {
          console.error(`Failed to push service ${service.id} to GLPI:`, response.data);
        } else {
          console.log(`Synced service ${service.id} to GLPI`);
        }
      } catch (error) {
        console.error(`Erro ao enviar serviço ${service.id} para o GLPI:`, error.message);
        // Corrigir verificação de erro
        const errorMessage = error.response?.data
          ? typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data)
          : 'Sem detalhes de erro';
        if (errorMessage.includes('Inventory is disabled')) {
          console.error('Inventário do GLPI está desabilitado. Habilite em Administração > Inventário.');
        } else {
          console.error('Detalhes do erro do GLPI:', errorMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing assets to GLPI:', error.message);
  }
}

// export async function createGlpiTicket(serviceName: string, description: string, criticality: string) {
//   try {
//     const sessionToken = await initGlpiSession();
//     const ticketData = {
//       name: `Falha no serviço: ${serviceName}`,
//       content: description,
//       urgency: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1, // Mapeia criticidade
//       impact: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1,
//       priority: criticality === 'high' ? 5 : criticality === 'medium' ? 3 : 1,
//       entities_id: 0, // Ajuste para a entidade desejada no GLPI
//       type: 1, // 1 = Incidente, 2 = Requisição
//     };
//     const ticket = await apiClient.assistance.add('Ticket', ticketData, { sessionToken });
//     //console.log('Resposta completa do GLPI:', JSON.stringify(ticket, null, 2));
//     const ticketId = ticket.id || ticket.data?.id || ticket.input?.id; // Tenta diferentes propriedades
//     if (!ticketId) {
//       throw new Error('ID do ticket não encontrado na resposta do GLPI');
//     }
//     console.log('Ticket criado no GLPI:', ticketId);
//     return ticketId;
//   } catch (error) {
//     console.error('Erro ao criar ticket no GLPI:', error);
//     throw new Error(`Falha ao criar ticket: ${error.message}`);
//   }
// }

// export async function updateGlpiTicket(ticketId: number, updateData: { content: string }) {
//   try {
//     const sessionToken = await initGlpiSession();
//     const updatedTicket = await apiClient.updateItem('Ticket', ticketId, updateData, { sessionToken });
//     console.log('Ticket atualizado no GLPI:', ticketId);
//     return updatedTicket;
//   } catch (error) {
//     console.error('Erro ao atualizar ticket no GLPI:', error);
//     throw new Error(`Falha ao atualizar ticket: ${error.message}`);
//   }
// }

export { apiClient }; // Exporta o cliente para uso em outros módulos