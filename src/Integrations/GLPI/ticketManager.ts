import axios from 'axios';
import 'dotenv/config';

const GLPI_API_URL = process.env.GLPI_API_URL || 'http://localhost:8080/apirest.php';
const GLPI_API_TOKEN = process.env.GLPI_APP_TOKEN;
const GLPI_ENTITY_ID = process.env.GLPI_ENTITY_ID || '0';
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;

let sessionToken: string | null = null;

async function initGlpiSession() {
  if (!GLPI_API_URL || !GLPI_API_TOKEN || !GLPI_USER_TOKEN) {
    console.error('Configuração do GLPI incompleta:');
    console.error(`GLPI_API_URL: ${GLPI_API_URL}, GLPI_API_TOKEN: ${GLPI_API_TOKEN ? 'Definido' : 'Ausente'}, GLPI_USER_TOKEN: ${GLPI_USER_TOKEN ? 'Definido' : 'Ausente'}`);
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
    console.error('Detalhes do erro:', error.response?.data || 'Sem detalhes');
    return null;
  }
}

export async function createGlpiTicket(serviceId: string, serviceName: string, serviceType: string, reason: string) {
  if (!GLPI_API_URL || !GLPI_API_TOKEN) {
    console.error('Configuração do GLPI incompleta: GLPI_API_URL ou GLPI_API_TOKEN ausente');
    return null;
  }

  if (!sessionToken) {
    const token = await initGlpiSession();
    if (!token) {
      console.error('Falha ao iniciar sessão GLPI, ticket não será criado');
      return null;
    }
  }

  // Definir severidade com base no motivo
  const urgency = reason.includes('DOWN') || reason.includes('crítico') || reason.includes('CPU') ? 5 : 3; // 5 = Muito Alta, 3 = Média
  const impact = reason.includes('DOWN') || reason.includes('crítico') || reason.includes('CPU') ? 5 : 3; // 5 = Alto, 3 = Médio
  const priority = urgency === 5 && impact === 5 ? 5 : 3; // 5 = Crítico, 3 = Médio

  const ticketData = {
    input: {
      entities_id: GLPI_ENTITY_ID,
      name: `Incidente: ${serviceName} - ${reason}`,
      content: `Alerta do InfraWatch\nServiço: ${serviceName}\nID: ${serviceId}s\nMotivo: ${reason}\nTipo: ${serviceType}`,
      urgency,
      impact,
      priority,
      type: 1, // 1 = Incidente
      itilcategories_id: 0, // Ajuste para categoria específica
      _link: {
        items_id: `infrawatch-${serviceId}`,
        itemtype: serviceType === 'SNMP' ? 'NetworkEquipment' : 'Computer',
      },
    },
  };

  try {
    const response = await axios.post(`${GLPI_API_URL}/Ticket`, ticketData, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_API_TOKEN,
        'Session-Token': sessionToken, // Obtenha via /initSession se necessário
      },
    });

    if (response.status === 201) {
      const ticketId = response.data.id;
      const ticketUrl = `${GLPI_API_URL}/Ticket/${ticketId}`;
      console.log(`Ticket criado para serviço ${serviceId}: ID ${ticketId}, URL ${ticketUrl}`);
      return { ticketId, ticketUrl };
    } else {
      console.error(`Falha ao criar ticket para serviço ${serviceId}:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`Erro ao criar ticket para serviço ${serviceId}:`, error.message);
    console.error('Detalhes do erro:', error.response?.data || 'Sem detalhes');
    return null;
  }
}

export async function closeGlpiTicket(ticketId: number) {
  if (!GLPI_API_URL || !GLPI_API_TOKEN) {
    console.error('Configuração do GLPI incompleta');
    return;
  }

  if (!sessionToken) {
    const token = await initGlpiSession();
    if (!token) {
      console.error('Falha ao iniciar sessão GLPI, ticket não será fechado');
      return;
    }
  }

  try {
    const response = await axios.put(`${GLPI_API_URL}/Ticket/${ticketId}`, {
      input: {
        id: ticketId,
        status: 6, // 6 = Fechado
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_API_TOKEN,
        'Session-Token': sessionToken,
      },
    });

    if (response.status === 200) {
      console.log(`Ticket ${ticketId} fechado com sucesso`);
    } else {
      console.error(`Falha ao fechar ticket ${ticketId}:`, response.data);
    }
  } catch (error) {
    console.error(`Erro ao fechar ticket ${ticketId}:`, error.message);
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


// import axios from 'axios';
// import 'dotenv/config';

// const GLPI_API_URL = process.env.GLPI_API_URL || 'http://localhost:8080/apirest.php';
// const GLPI_API_TOKEN = process.env.GLPI_API_TOKEN;
// const GLPI_ENTITY_ID = process.env.GLPI_ENTITY_ID || '0';

// export async function createGlpiTicket(serviceId: string, serviceName: string, serviceType: string, reason: string, criticality: string = 'medium') {
//   if (!GLPI_API_URL || !GLPI_API_TOKEN) {
//     console.error('Configuração do GLPI incompleta: GLPI_API_URL ou GLPI_API_TOKEN ausente');
//     return null;
//   }

//   const urgency = criticality === 'critical' || reason.includes('DOWN') || reason.includes('CPU') ? 5 : 3;
//   const impact = criticality === 'critical' || reason.includes('DOWN') || reason.includes('CPU') ? 5 : 3;
//   const priority = urgency === 5 && impact === 5 ? 5 : 3;

//   const ticketData = {
//     input: {
//       entities_id: GLPI_ENTITY_ID,
//       name: `Incidente: ${serviceName} - ${reason}`,
//       content: `Alerta do InfraWatch\nServiço: ${serviceName}\nID: ${serviceId}\nMotivo: ${reason}\nTipo: ${serviceType}\nCriticidade: ${criticality}`,
//       urgency,
//       impact,
//       priority,
//       type: 1, // 1 = Incidente
//       itilcategories_id: 0,
//       _link: {
//         items_id: `infrawatch-${serviceId}`,
//         itemtype: serviceType === 'SNMP' ? 'NetworkEquipment' : 'Computer',
//       },
//     },
//   };

//   try {
//     const response = await axios.post(`${GLPI_API_URL}/Ticket`, ticketData, {
//       headers: {
//         'Content-Type': 'application/json',
//         'App-Token': GLPI_API_TOKEN,
//         'Session-Token': '',
//       },
//     });

//     if (response.status === 201) {
//       const ticketId = response.data.id;
//       const ticketUrl = `${GLPI_API_URL}/Ticket/${ticketId}`;
//       console.log(`Ticket criado para serviço ${serviceId}: ID ${ticketId}, URL ${ticketUrl}`);
//       return { ticketId, ticketUrl };
//     } else {
//       console.error(`Falha ao criar ticket para serviço ${serviceId}:`, response.data);
//       return null;
//     }
//   } catch (error) {
//     console.error(`Erro ao criar ticket para serviço ${serviceId}:`, error.message);
//     console.error('Detalhes do erro:', error.response?.data || 'Sem detalhes');
//     return null;
//   }
// }

// export async function closeGlpiTicket(ticketId: number) {
//   if (!GLPI_API_URL || !GLPI_API_TOKEN) {
//     console.error('Configuração do GLPI incompleta');
//     return;
//   }

//   try {
//     const response = await axios.put(`${GLPI_API_URL}/Ticket/${ticketId}`, {
//       input: {
//         id: ticketId,
//         status: 6, // 6 = Fechado
//       },
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'App-Token': GLPI_API_TOKEN,
//         'Session-Token': '',
//       },
//     });

//     if (response.status === 200) {
//       console.log(`Ticket ${ticketId} fechado com sucesso`);
//     } else {
//       console.error(`Falha ao fechar ticket ${ticketId}:`, response.data);
//     }
//   } catch (error) {
//     console.error(`Erro ao fechar ticket ${ticketId}:`, error.message);
//   }
// }