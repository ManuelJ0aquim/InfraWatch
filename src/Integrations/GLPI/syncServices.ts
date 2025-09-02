import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();
const GLPI_API_URL = process.env.GLPI_API_URL || 'http://localhost:8080/apirest.php';
const GLPI_API_TOKEN = process.env.GLPI_APP_TOKEN;
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;
const GLPI_ENTITY_ID = process.env.GLPI_ENTITY_ID || '0';

let sessionToken: string | null = null;

async function initGlpiSession() {
  if (!GLPI_API_URL || !GLPI_API_TOKEN || !GLPI_USER_TOKEN) {
    console.error('Configuração do GLPI incompleta:', {
      GLPI_API_URL,
      GLPI_API_TOKEN: GLPI_API_TOKEN ? 'Definido' : 'Ausente',
      GLPI_USER_TOKEN: GLPI_USER_TOKEN ? 'Definido' : 'Ausente',
    });
    return null;
  }
  try {
    const response = await axios.get(`${GLPI_API_URL}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_API_TOKEN,
        'Authorization': `user_token ${GLPI_USER_TOKEN}`,
      },
    });
    sessionToken = response.data.session_token;
    console.log(`Sessão GLPI iniciada: Session-Token ${sessionToken}`);
    return sessionToken;
  } catch (error) {
    console.error('Erro ao iniciar sessão GLPI:', error.message);
    return null;
  }
}

export async function syncServiceToGLPI(serviceId: string) {
  if (!sessionToken) {
    const token = await initGlpiSession();
    if (!token) {
      console.error('Falha ao iniciar sessão GLPI, sincronização abortada');
      return;
    }
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    console.error(`Serviço ${serviceId} não encontrado`);
    return;
  }
  // Validate service data
  if (!service.name || !service.type) {
    console.error(`Dados inválidos para serviço ${serviceId}:`, {
      name: service.name,
      type: service.type,
      target: service.target,
      criticality: service.criticality,
    });
    return;
  }
  
  try {
    const itemType = service.type === 'SNMP' ? 'NetworkEquipment' : 'Computer';
    const serviceData = {
      input: {
        entities_id: GLPI_ENTITY_ID,
        name: service.name,
        serial: `infrawatch-${service.id}`,
        otherserial: service.id,
        comment: `Serviço monitorado pelo InfraWatch\nTipo: ${service.type}\nAlvo: ${service.target}\nCriticidade: ${service.criticality || 'medium'}`,
        status: service.status === 'UP' ? 1 : 2, // 1 = Active, 2 = Inactive
      },
    };

    // Check if service exists in GLPI
    const searchResponse = await axios.get(`${GLPI_API_URL}/search/${itemType}`, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_API_TOKEN,
        'Session-Token': sessionToken,
      },
      params: {
        criteria: [{ field: 40, searchtype: 'equals', value: service.id }],
      },
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      // Update existing service
      const glpiId = searchResponse.data.data[0][1];
      await axios.put(`${GLPI_API_URL}/${itemType}/${glpiId}`, serviceData, {
        headers: {
          'Content-Type': 'application/json',
          'App-Token': GLPI_API_TOKEN,
          'Session-Token': sessionToken,
        },
      });
      console.log(`Updated service ${service.id} in GLPI: ${itemType}/${glpiId}`);
    } else {
      // Create new service
      const response = await axios.post(`${GLPI_API_URL}/${itemType}`, serviceData, {
        headers: {
          'Content-Type': 'application/json',
          'App-Token': GLPI_API_TOKEN,
          'Session-Token': sessionToken,
        },
      });
      console.log(`Synced service ${service.id} to GLPI: ${itemType}/${response.data.id}`);
    }
  } catch (error) {
    console.error(`Erro ao sincronizar serviço ${serviceId} com GLPI:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
  }
}

export async function syncAllServicesToGLPI() {
  console.log('Sincronizando inventário com GLPI...');
  const services = await prisma.service.findMany();
  for (const service of services) {
    await syncServiceToGLPI(service.id);
  }
}

export async function killGlpiSession() {
  if (!sessionToken) {
    console.log('Nenhuma sessão GLPI ativa para encerrar');
    return;
  }
  try {
    await axios.get(`${GLPI_API_URL}/killSession`, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_API_TOKEN,
        'Session-Token': sessionToken,
      },
    });
    console.log('Sessão GLPI encerrada com sucesso');
    sessionToken = null;
  } catch (error) {
    console.error('Erro ao encerrar sessão GLPI:', error.message);
  }
}