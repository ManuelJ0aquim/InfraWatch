# SLA_TRACKING (Uptime)

Módulo completo de **SLA Tracking** (percentual de uptime) por serviço/sistema.

## 1) Migração (PostgreSQL)
```bash
psql "$DATABASE_URL" -f src/SLA_TRACKING/db/migrations/2025-08-13_add_sla_tracking.sql
```
> Opcional: use `src/SLA_TRACKING/db/prisma.schema` para integrar ao seu `schema.prisma` (ajuste nomes/ids).

## 2) Registrar rotas no Fastify
```ts
import slaRoutes from "./src/SLA_TRACKING/api/routes";
await app.register(slaRoutes);
```

## 3) Testes rápidos (cURL)

1) **Criar política** (99.9% / mês em Africa/Luanda)
```bash
curl -X POST "http://localhost:3000/api/sla/policies" -H "content-type: application/json" -d '{
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "targetPct": 99.9,
  "period": "MONTH",
  "timezone": "Africa/Luanda"
}'
```

2) **(Opcional) Agendar manutenção**
```bash
curl -X POST "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/maintenance-windows"   -H "content-type: application/json" -d '{
    "startsAt": "2025-08-10T02:00:00.000Z",
    "endsAt": "2025-08-10T03:00:00.000Z",
    "reason": "Atualização programada"
}'
```

3) **Registrar incidentes**
```bash
curl -X POST "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/incidents"   -H "content-type: application/json" -d '{
    "startedAt": "2025-08-12T10:00:00.000Z",
    "endedAt":   "2025-08-12T10:20:00.000Z",
    "isPlanned": false
}'
```

4) **Consultar status do mês**
```bash
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/status?period=2025-08"
```

5) **Listar incidentes/manutenções**
```bash
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/incidents?from=2025-08-01T00:00:00.000Z&to=2025-09-01T00:00:00.000Z"
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/maintenance-windows?from=2025-08-01T00:00:00.000Z&to=2025-09-01T00:00:00.000Z"
```

## 4) Como funciona
- Incidentes (DOWN) - consolidados e salvos em `Incident`.
- Manutenções não contam como downtime.
- `SlaPolicy` define a meta.
- `SlaWindow` guarda resultado do mês (uptime%, orçamento, status).

## 5) Jobs (opcional)
- `rollupWindow.job.ts`: fecha/atualiza janelas do mês atual ou específico.
- `alerting.job.ts`: loga AT_RISK/BREACHED (integre com seu sistema de notificações).
- `ingestStatus.job.ts`: converte amostras brutas em incidentes com histerese/merge.

## 6) Observações
- TZ padrão: Africa/Luanda.
- Dados faltantes não contam como DOWN (crie incidentes só quando tiver amostras válidas).
