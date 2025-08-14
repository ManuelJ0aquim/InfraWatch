# API de SLA/SLI - InfraWatch

## Visão Geral

Este sistema implementa o gerenciamento de **SLA (Service Level Agreement)** e **SLI (Service Level Indicator)** para o InfraWatch, permitindo:

- ✅ Criação e gerenciamento de SLAs
- 📊 Registro automático de SLIs baseado no monitoramento
- 📈 Cálculo automático de métricas de disponibilidade
- 🚨 Atualização automática de status de SLAs
- 📋 Dashboard com estatísticas consolidadas

## Principais Funcionalidades

### 1. **Gerenciamento de SLAs**
- Criar SLAs para períodos específicos
- Atualizar status automaticamente
- Calcular compliance baseado nos SLIs

### 2. **Registro de SLIs**
- Criação manual de SLIs
- Geração automática baseada no monitoramento
- Cálculo de métricas de disponibilidade

### 3. **Dashboard e Relatórios**
- Visão consolidada de todos os serviços
- Estatísticas de disponibilidade
- Relatórios por período

### 4. **Automação**
- Atualização automática de SLAs
- Geração de SLIs baseada no monitoramento
- Limpeza de dados antigos

## Endpoints da API

### 🎯 **SLAs**

#### `POST /api/sla`
Criar um novo SLA para um serviço.

**Body:**
```json
{
  "serviceId": "string",
  "targetSli": 99.9,
  "periodStart": "2025-01-01T00:00:00.000Z",
  "periodEnd": "2025-01-31T23:59:59.999Z"
}
```

#### `GET /api/sla/service/{serviceId}`
Listar todos os SLAs de um serviço específico.

#### `GET /api/sla/{slaId}`
Obter detalhes de um SLA específico.

#### `PUT /api/sla/{slaId}/status`
Atualizar o status de um SLA baseado nos SLIs atuais.

#### `GET /api/sla/service/{serviceId}/calculate`
Calcular SLA para um período específico.

**Query Parameters:**
- `startDate` (opcional): Data de início
- `endDate` (opcional): Data de fim

#### `GET /api/sla/service/{serviceId}/statistics`
Obter estatísticas detalhadas de SLA para um serviço.

### 📊 **SLIs**

#### `POST /api/sli`
Criar um novo registro de SLI.

**Body:**
```json
{
  "serviceId": "string",
  "achieved": 100.0,
  "target": 100.0
}
```

#### `GET /api/sli/service/{serviceId}`
Listar SLIs de um serviço em um período específico.

**Query Parameters:**
- `startDate` (opcional): Data de início
- `endDate` (opcional): Data de fim

#### `POST /api/sli/generate-batch`
Gerar SLIs em lote para todos os serviços.

### 🏠 **Dashboard**

#### `GET /api/dashboard`
Obter dados consolidados para o dashboard de SLAs.

**Query Parameters:**
- `userId` (opcional): ID do usuário

**Resposta inclui:**
- Resumo dos serviços (total, UP, DOWN, percentual de saúde)
- Visão geral dos SLAs (total, atendidos, violados, pendentes)
- Lista de serviços com contadores
- SLAs recentes

### ⚙️ **Gerenciamento**

#### `POST /api/sla/update`
Forçar atualização manual de SLAs.

**Body:**
```json
{
  "serviceId": "string" // opcional
}
```

#### `GET /api/sla/manager/status`
Obter status e estatísticas do gerenciador de SLAs.

## Integração com Monitoramento

O sistema integra automaticamente com o monitoramento existente:

### **Geração Automática de SLIs**

Para cada resultado de monitoramento, o sistema calcula automaticamente um SLI baseado em:

#### **HTTP Services:**
- ✅ **UP + Tempo < 1s**: 100% SLI
- 🟡 **UP + Tempo 1-2s**: 90% SLI  
- 🟠 **UP + Tempo > 2s**: 75% SLI
- ❌ **DOWN**: 0% SLI

#### **PING Services:**
- 📊 **SLI = 100% - Perda de Pacotes**
- ❌ **DOWN**: 0% SLI

#### **SNMP Services:**
- ✅ **UP + Dados completos**: 100% SLI
- 🟡 **UP + Dados parciais**: 75-50% SLI
- ❌ **DOWN**: 0% SLI

#### **WEBHOOK Services:**
- ✅ **2xx HTTP**: 100% SLI
- 🟡 **3xx HTTP**: 80% SLI
- 🟠 **4xx HTTP**: 25% SLI
- ❌ **5xx HTTP ou DOWN**: 0% SLI

## Configuração

### **Configuração do Gerenciador**

```typescript
{
  autoUpdateEnabled: true,          // Habilitar atualizações automáticas
  autoUpdateIntervalMinutes: 60,    // Intervalo entre atualizações (minutos)
  createMissingSLAs: true,          // Criar SLAs ausentes automaticamente
  updatePendingSLAs: true,          // Atualizar SLAs pendentes
  cleanupOldSLAsEnabled: true,      // Limpar dados antigos
  cleanupOlderThanDays: 365         // Manter dados por 1 ano
}
```

### **Inicialização no Servidor**

O sistema é inicializado automaticamente no `server.ts`:

```typescript
await initializeSLAManager(prisma, {
  autoUpdateEnabled: true,
  autoUpdateIntervalMinutes: 60,
  // ... outras configurações
});
```

## Validações e Regras de Negócio

### **Validações de Entrada:**
- ✅ ServiceId deve existir
- ✅ Datas devem ser válidas (ISO 8601)
- ✅ Data início < Data fim
- ✅ Período máximo: 1 ano
- ✅ Dados não podem ser > 2 anos antigos
- ✅ SLI values devem ser positivos
- ✅ Target SLI: 0-100%

### **Regras de Negócio:**
- 🔄 SLAs são atualizados automaticamente a cada hora
- 📊 SLIs são gerados automaticamente no monitoramento  
- 🧹 Limpeza automática de dados antigos (configurável)
- 🚨 Status de SLA: PENDING → MET/BREACHED baseado nos SLIs

## Status de SLA

- **PENDING**: Aguardando dados suficientes
- **MET**: Meta atingida (achievedSli >= targetSli)
- **BREACHED**: Meta não atingida (achievedSli < targetSli)

## Comandos Úteis

### **Executar Atualização Manual:**
```bash
cd src/Sla
node -r ts-node/register update-slas.ts
```

### **Executar para Serviço Específico:**
```bash
node -r ts-node/register update-slas.ts --service=SERVICE_ID
```

### **Apenas Atualizar (Não Criar):**
```bash
node -r ts-node/register update-slas.ts --no-create
```

## Exemplos de Uso

### **1. Criar um SLA para Janeiro:**
```javascript
POST /api/sla
{
  "serviceId": "cluxxxxx",
  "targetSli": 99.9,
  "periodStart": "2025-01-01T00:00:00.000Z",
  "periodEnd": "2025-01-31T23:59:59.999Z"
}
```

### **2. Obter Estatísticas de um Serviço:**
```javascript
GET /api/sla/service/cluxxxxx/statistics
// Resposta:
{
  "message": "Estatísticas de SLA recuperadas com sucesso",
  "data": {
    "service": { "id": "cluxxxxx", "name": "API Principal" },
    "statistics": {
      "totalSLAs": 12,
      "metSLAs": 10,
      "breachedSLAs": 2,
      "pendingSLAs": 0,
      "successRate": 83.33
    }
  }
}
```

### **3. Dashboard Consolidado:**
```javascript
GET /api/dashboard
// Resposta inclui resumo completo de serviços e SLAs
```

## Documentação da API

A documentação completa da API está disponível em:
📖 **http://localhost:3000/docs** (Swagger UI)

## Monitoramento e Logs

O sistema produz logs detalhados para:
- ✅ Criação de SLAs/SLIs
- 🔄 Atualizações automáticas
- ❌ Erros e falhas
- 📊 Estatísticas de processamento

## Troubleshooting

### **Problema: SLAs não são atualizados automaticamente**
- ✅ Verificar se o gerenciador está ativo: `GET /api/sla/manager/status`
- ✅ Verificar logs do servidor para erros

### **Problema: SLIs não são gerados automaticamente**
- ✅ Verificar se a integração está habilitada no monitoramento
- ✅ Verificar se os serviços estão sendo monitorados corretamente

### **Problema: Dados antigos ocupando muito espaço**
- ✅ Habilitar limpeza automática na configuração
- ✅ Executar limpeza manual se necessário

---

🎉 **Sistema de SLA/SLI implementado e integrado com sucesso!**
