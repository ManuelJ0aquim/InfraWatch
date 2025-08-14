# Guia de Testes Manuais - SLA Tracking Endpoints

## 📋 PRÉ-REQUISITOS

1. **Servidor Fastify** rodando com o módulo SLA_TRACKING registrado
2. **Base de dados PostgreSQL** com as migrations aplicadas
3. **Swagger UI** disponível (se configurado) ou **cliente HTTP** (Postman, curl, etc.)

## 🚀 CONFIGURAÇÃO INICIAL

### 1. Aplicar Migrations
```bash
psql "$DATABASE_URL" -f src/SLA_TRACKING/db/migrations/2025-08-13_add_sla_tracking.sql
```

### 2. Registrar Rotas no Fastify
```typescript
import slaRoutes from "./src/SLA_TRACKING/api/routes";
await app.register(slaRoutes);
```

### 3. Configurar Swagger (Opcional)
```typescript
await app.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'SLA Tracking API',
      description: 'API para monitoramento de SLA e uptime',
      version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

await app.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});
```

## 🧪 TESTES MANUAIS DOS ENDPOINTS

### 1. 📊 **Criar Política SLA** 
**Endpoint:** `POST /api/sla/policies`

#### Payload de Exemplo:
```json
{
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "targetPct": 99.9,
  "period": "MONTH",
  "timezone": "Africa/Luanda"
}
```

#### Teste via cURL:
```bash
curl -X POST "http://localhost:3000/api/sla/policies" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "00000000-0000-0000-0000-000000000001",
    "targetPct": 99.9,
    "period": "MONTH",
    "timezone": "Africa/Luanda"
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "id": "uuid-gerado",
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "targetPct": 99.9,
  "period": "MONTH", 
  "timezone": "Africa/Luanda",
  "activeFrom": "2025-08-14T...",
  "activeTo": null,
  "createdAt": "2025-08-14T...",
  "updatedAt": "2025-08-14T..."
}
```

#### ❌ Casos de Erro:
```bash
# Teste sem campos obrigatórios
curl -X POST "http://localhost:3000/api/sla/policies" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "test"}'
# Esperado: 400 Bad Request
```

---

### 2. 📋 **Listar Políticas SLA**
**Endpoint:** `GET /api/sla/policies`

#### Teste via cURL:
```bash
curl "http://localhost:3000/api/sla/policies"
```

#### ✅ Resultado Esperado:
```json
{
  "data": [
    {
      "id": "uuid",
      "serviceId": "00000000-0000-0000-0000-000000000001",
      "targetPct": 99.9,
      "period": "MONTH",
      "timezone": "Africa/Luanda",
      // ... outros campos
    }
  ]
}
```

---

### 3. 🔧 **Criar Janela de Manutenção**
**Endpoint:** `POST /api/services/:id/maintenance-windows`

#### Payload de Exemplo:
```json
{
  "startsAt": "2025-08-15T02:00:00.000Z",
  "endsAt": "2025-08-15T03:00:00.000Z",
  "reason": "Atualização programada"
}
```

#### Teste via cURL:
```bash
curl -X POST "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/maintenance-windows" \
  -H "Content-Type: application/json" \
  -d '{
    "startsAt": "2025-08-15T02:00:00.000Z",
    "endsAt": "2025-08-15T03:00:00.000Z",
    "reason": "Atualização programada"
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "id": "uuid-gerado",
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "startsAt": "2025-08-15T02:00:00.000Z",
  "endsAt": "2025-08-15T03:00:00.000Z",
  "reason": "Atualização programada"
}
```

---

### 4. 🚨 **Registrar Incidente**
**Endpoint:** `POST /api/services/:id/sla/incidents`

#### Payload de Exemplo:
```json
{
  "startedAt": "2025-08-14T10:00:00.000Z",
  "endedAt": "2025-08-14T10:20:00.000Z",
  "isPlanned": false
}
```

#### Teste via cURL:
```bash
curl -X POST "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/incidents" \
  -H "Content-Type: application/json" \
  -d '{
    "startedAt": "2025-08-14T10:00:00.000Z",
    "endedAt": "2025-08-14T10:20:00.000Z",
    "isPlanned": false
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "id": "uuid-gerado",
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "startedAt": "2025-08-14T10:00:00.000Z",
  "endedAt": "2025-08-14T10:20:00.000Z",
  "isPlanned": false,
  "source": "manual",
  "createdAt": "2025-08-14T..."
}
```

---

### 5. 📊 **Consultar Status SLA**
**Endpoint:** `GET /api/services/:id/sla/status?period=YYYY-MM`

#### Teste via cURL:
```bash
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/status?period=2025-08"
```

#### ✅ Resultado Esperado:
```json
{
  "window": {
    "periodStart": "2025-07-31T23:00:00.000Z",
    "periodEnd": "2025-08-31T23:00:00.000Z",
    "availabilityPct": 99.8765,
    "errorBudget": {
      "allowedMs": 2678400000,
      "usedMs": 1200000,
      "remainingMs": 2677200000
    },
    "status": "OK",
    "computedAt": "2025-08-14T..."
  }
}
```

#### ❌ Casos de Erro:
```bash
# Período inválido
curl "http://localhost:3000/api/services/test/sla/status?period=invalid"
# Esperado: 400 Bad Request

# Sem política ativa
curl "http://localhost:3000/api/services/novo-servico/sla/status?period=2025-08"
# Esperado: 404 Not Found
```

---

### 6. 📋 **Listar Incidentes**
**Endpoint:** `GET /api/services/:id/sla/incidents?from=ISO&to=ISO`

#### Teste via cURL:
```bash
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/incidents?from=2025-08-01T00:00:00Z&to=2025-08-31T23:59:59Z"
```

#### ✅ Resultado Esperado:
```json
{
  "data": [
    {
      "id": "uuid",
      "serviceId": "00000000-0000-0000-0000-000000000001",
      "startedAt": "2025-08-14T10:00:00.000Z",
      "endedAt": "2025-08-14T10:20:00.000Z",
      "isPlanned": false,
      "source": "manual",
      "createdAt": "2025-08-14T..."
    }
  ]
}
```

---

## 🧪 CENÁRIOS DE TESTE COMPLETOS

### Cenário 1: **Fluxo Completo de SLA**
1. Criar política SLA (99.9%)
2. Criar janela de manutenção 
3. Registrar incidente durante manutenção
4. Registrar incidente fora da manutenção
5. Consultar status SLA
6. Verificar que apenas downtime não planejado conta

### Cenário 2: **Validação de Error Budget**
1. Criar política com SLA baixo (ex: 90%)
2. Registrar vários incidentes
3. Verificar que status muda para AT_RISK depois BREACHED
4. Consultar métricas de error budget

### Cenário 3: **Testes de Timezone**
1. Criar política com timezone Africa/Luanda
2. Consultar status para diferentes meses
3. Verificar que período é calculado corretamente

## 📖 SWAGGER INTEGRATION

### Adicionando Schemas para Swagger
```typescript
const policySchema = {
  type: 'object',
  required: ['targetPct', 'period', 'timezone'],
  properties: {
    serviceId: { type: 'string', format: 'uuid' },
    systemId: { type: 'string', format: 'uuid' },
    targetPct: { type: 'number', minimum: 0, maximum: 100 },
    period: { type: 'string', enum: ['MONTH'] },
    timezone: { type: 'string' },
    activeFrom: { type: 'string', format: 'date-time' },
    activeTo: { type: 'string', format: 'date-time' }
  }
};

// Registrar schema no Fastify
app.addSchema({
  $id: 'policySchema',
  ...policySchema
});
```

### Acessando Swagger UI
- **URL**: `http://localhost:3000/docs`
- **Documentação interativa** com todos os endpoints
- **Teste direto** via interface web
- **Validação automática** de payloads

## ✅ CHECKLIST DE VERIFICAÇÃO

### Funcionalidades Core:
- [ ] Criar política SLA
- [ ] Listar políticas 
- [ ] Criar janela de manutenção
- [ ] Registrar incidentes
- [ ] Consultar status SLA
- [ ] Listar incidentes
- [ ] Verificar cálculo de availability
- [ ] Verificar error budget
- [ ] Verificar estados (OK/AT_RISK/BREACHED)

### Validações:
- [ ] Campos obrigatórios
- [ ] Formato UUID
- [ ] Formato ISO de datas
- [ ] Validação de percentuais
- [ ] Timezone handling
- [ ] Error handling

### Performance:
- [ ] Tempo de resposta < 500ms
- [ ] Queries eficientes
- [ ] Memory usage estável
