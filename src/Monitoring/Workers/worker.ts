import { checkServices } from './utills_worker'

export async function startMonitoring()
{
  console.log('🔍 Monitoramento iniciado...');
  await checkServices();
  setInterval(async () => { await checkServices(); }, 1000);
}

