# Guia de Testes SLA Tracking - Swagger UI

Este documento contém exemplos de como testar o módulo SLA Tracking através do Swagger UI.

## 🚀 Acesse o Swagger UI

```
http://localhost:3000/docs
```

## 📋 Sequência de Testes Recomendada

### 1. Health Check
Primeiro, teste se o servidor está funcionando:
- **GET** `/health`
- Não precisa de parâmetros

### 2. Criar uma Política de SLA
Use o endpoint **POST** `/api/sla/policies` com este JSON:

```json
{
  "serviceId": "00000000-0000-0000-0000-000000000001",
  "targetPct": 99.9,
  "period": "MONTH",
  "timezone": "Africa/Luanda"
}
```

**Explicação dos campos:**
- `serviceId`: ID único do serviço (obrigatório se não tiver systemId)
- `targetPct`: Meta de uptime (ex: 99.9 = 99.9%)
- `period`: Período de avaliação (só aceita "MONTH")
- `timezone`: Fuso horário para cálculos

### 3. Listar Políticas
Use o endpoint **GET** `/api/sla/policies` para ver todas as políticas criadas.

### 4. Agendar uma Janela de Manutenção (Opcional)
Use o endpoint **POST** `/api/services/{id}/maintenance-windows`:

**Parâmetros:**
- `id`: `00000000-0000-0000-0000-000000000001`

**Body:**
```json
{
  "startsAt": "2025-08-15T02:00:00.000Z",
  "endsAt": "2025-08-15T03:00:00.000Z",
  "reason": "Manutenção programada do sistema"
}
```

### 5. Registrar um Incidente
Use o endpoint **POST** `/api/services/{id}/sla/incidents`:

**Parâmetros:**
- `id`: `00000000-0000-0000-0000-000000000001`

**Body:**
```json
{
  "startedAt": "2025-08-14T10:00:00.000Z",
  "endedAt": "2025-08-14T10:20:00.000Z",
  "isPlanned": false
}
```

### 6. Consultar Status de SLA
Use o endpoint **GET** `/api/services/{id}/sla/status`:

**Parâmetros:**
- `id`: `00000000-0000-0000-0000-000000000001`
- `period` (query): `2025-08`

### 7. Listar Incidentes
Use o endpoint **GET** `/api/services/{id}/sla/incidents`:

**Parâmetros:**
- `id`: `00000000-0000-0000-0000-000000000001`
- `from` (query): `2025-08-01T00:00:00.000Z`
- `to` (query): `2025-09-01T00:00:00.000Z`

### 8. Listar Janelas de Manutenção
Use o endpoint **GET** `/api/services/{id}/maintenance-windows`:

**Parâmetros:**
- `id`: `00000000-0000-0000-0000-000000000001`
- `from` (query): `2025-08-01T00:00:00.000Z`
- `to` (query): `2025-09-01T00:00:00.000Z`

## 🔍 Testando Diferentes Cenários

### Cenário 1: Serviço com Alta Disponibilidade
```json
{
  "serviceId": "11111111-1111-1111-1111-111111111111",
  "targetPct": 99.95,
  "period": "MONTH",
  "timezone": "Africa/Luanda"
}
```

### Cenário 2: Sistema Crítico
```json
{
  "systemId": "22222222-2222-2222-2222-222222222222",
  "targetPct": 99.99,
  "period": "MONTH",
  "timezone": "Africa/Luanda"
}
```

### Cenário 3: Incidente Longo
```json
{
  "startedAt": "2025-08-14T08:00:00.000Z",
  "endedAt": "2025-08-14T12:00:00.000Z",
  "isPlanned": false
}
```

### Cenário 4: Manutenção Programada
```json
{
  "startedAt": "2025-08-14T09:00:00.000Z",
  "endedAt": "2025-08-14T11:00:00.000Z",
  "isPlanned": true
}
```

## 📊 Interpretando os Resultados

### Status de SLA:
- **OK**: Dentro da meta
- **AT_RISK**: Próximo de violar a meta
- **BREACHED**: Meta violada

### Campos importantes:
- `uptimePercent`: Percentual de uptime atual
- `targetPercent`: Meta de uptime
- `budgetMinutes`: Orçamento total de downtime em minutos
- `usedMinutes`: Minutos de downtime já utilizados

## 🛠️ Dicas de Uso

1. **Sempre crie uma política primeiro** antes de registrar incidentes
2. **Use IDs consistentes** para manter os dados organizados
3. **Teste com datas realistas** para ver os cálculos funcionando
4. **Manutenções não afetam o SLA** - apenas incidentes não planejados
5. **Formatos de data** devem ser ISO 8601 (ex: 2025-08-14T10:00:00.000Z)

## 🔧 Comandos cURL Equivalentes

Se preferir testar via linha de comando:

```bash
# Criar política
curl -X POST "http://localhost:3000/api/sla/policies" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "00000000-0000-0000-0000-000000000001", "targetPct": 99.9, "period": "MONTH", "timezone": "Africa/Luanda"}'

# Registrar incidente
curl -X POST "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/incidents" \
  -H "Content-Type: application/json" \
  -d '{"startedAt": "2025-08-14T10:00:00.000Z", "endedAt": "2025-08-14T10:20:00.000Z", "isPlanned": false}'

# Consultar status
curl "http://localhost:3000/api/services/00000000-0000-0000-0000-000000000001/sla/status?period=2025-08"
```
