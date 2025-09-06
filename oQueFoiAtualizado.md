InfraWatch → InfraWatch2: Relatório de Mudanças

Resumo das principais alterações entre as pastas `InfraWatch` (antigo) e `InfraWatch2` (atual):

- Foco reduzido e simplificação: autenticação e partes do sistema de escalonamento/SLI foram removidos no `InfraWatch2`.
- Rotas reorganizadas: adição e remoção de serviços migraram para o módulo de rotas de serviços; rotas de autenticação foram retiradas.
- Fila (BullMQ) simplificada: apenas enfileiramento de verificação de serviço; remoção de jobs de retry/escalation/SLI e utilitários de limpeza/admin.
- Métricas Influx simplificadas: campos de escalonamento/SLI removidos; grava apenas `isUp` e `latency_ms` além do `serviceId` tag.
- Prisma/Schema: remoção de campos e enums (ex.: `escalationLevel`, `escalationChain`, `Role`, `WEBHOOK`), além de redução de tabelas relacionadas a Ticket/Webhook/User.
- Server/Env: usa `PORT` (antes `PORT1`) e abre LocalTunnel incondicionalmente.
- Scripts NPM: scripts de banco (`migrate`, `db:push`, `seed`) foram removidos do `InfraWatch2`.

Arquivos e Rotas

- Removido (existia no `InfraWatch`, não existe no `InfraWatch2`):
  - Rotas de autenticação: `src/routes/Auth/*` e controladores `src/Controllers/Auth/*`.
  - Rotas: `src/routes/APIs/addServiceRoutes.ts`, `src/routes/APIs/queueAdminRoutes.ts`.
  - Monitoramento/Incidentes: `src/Monitoring/Incidents/escalationManager.ts`.
  - SLI: `src/Monitoring/SlaTracking/sliEvaluator.ts`.
  - Tipos: `src/types/net-snmp.d.ts`.
  - Utilitários de fila: purga, métricas e enfileiramentos de retry/escalation/SLI em `src/Monitoring/Queue/jobQueue.ts` (removidos no `InfraWatch2`).

- Adicionado/Movido (novo no `InfraWatch2`):
  - `src/Controllers/APIs/deleteServices.ts` (nova ação de exclusão de serviço).
  - `src/routes/APIs/servicesRoutes.ts` agora agrega também POST de criação e DELETE de remoção (substitui o antigo `addServiceRoutes.ts`).

- Alterado:
  - `src/RegisterRoutes/RegisterRoutes.ts`: remoção do registro de rotas de autenticação e de `addServiceRoutes`/`queueAdminRoutes`.
  - `src/Monitoring/Workers/worker.ts`: remove checagens/flags (ex.: `DISABLE_SCHEDULER`, limpeza de fila e verificação de Redis) e passa a carregar worker e scheduler de forma direta.
  - `src/Influxdb/WriteMetrics/WriteServiceStatus.ts`: remove campos extra (escalonamento/SLI) e logs; mantém status e latência.
  - `src/server.ts`:
    - Usa `PORT` (antes `PORT1`).
    - Modo de túnel: no `InfraWatch2` o LocalTunnel é aberto sempre (antes dependia de `ENABLE_TUNNEL=true`).

Schema Prisma (Diferenças)

Comparação entre `InfraWatch/prisma/schema.prisma` (antigo) e `InfraWatch2/prisma/schema.prisma` (novo):

- Model `Service`:
  - Mantidos: `id`, `name`, `type`, `target`, `ownerId`, `createdAt`, `updatedAt`, `glpiId? @unique`, `snmpCommunity?`, `snmpPort? @default(161)` e relações.
  - Índices se mantêm: `@@index([ownerId])` e `@@index([type])`.

- Model `Incident`:
  - `InfraWatch` (antigo): possuía `escalationLevel Int @default(0)`, `nextRetryAt DateTime?`, `lastEscalationAt DateTime?`, além de `glpiTicketId?` e `glpiTicketUrl?` via migração.
  - `InfraWatch2` (novo): removeu os campos de escalonamento e GLPI; ficou apenas com: `id`, `serviceId`, `openedAt`, `closedAt?`, `reason?`, `retryCount @default(0)`, `lastNotificationAt?` e relação.

- Model `NotificationPolicy`:
  - `InfraWatch` (antigo): incluía `escalationChain Json?`.
  - `InfraWatch2` (novo): remove `escalationChain`; mantém `maxRetries`, `retryIntervalMinutes`, `escalateAfterMinutes`, `cooldownMinutes`, `recoveryConfirmations`, `channels[]`, `active`, `isDefault`, timestamps e relação opcional com `Service`.

- Enums:
  - `InfraWatch` (antigo): `enum Role { ADMIN USER }` e `enum ServiceType { HTTP PING SNMP WEBHOOK }`.
  - `InfraWatch2` (novo): remove `Role` e reduz `ServiceType` para `{ HTTP PING SNMP }` (remove `WEBHOOK`).

- Tabelas colaterais (conforme histórico de migração):
  - `InfraWatch` removeu tabelas `User`, `Ticket`, `WebhookEvent` e seus enums (`TicketPrioridade`, `TicketStatus`) via migração posterior.
  - `InfraWatch2` não define esses modelos no schema atual.

Migrações (Prisma)

- `InfraWatch/prisma/migrations`:
  - `20250824205132_update` (criação inicial – inclui `User`, `Ticket`, `WebhookEvent`, `Role`, `Ticket*`, etc.).
  - `20250904145544_add_glpi_ticket_id` (remove `User`, `Ticket`, `WebhookEvent` e enums `Ticket*`).
  - `20250904150000_schema_sync` (sincroniza com o schema: adiciona `snmpCommunity`, `snmpPort`, `glpiId` únicos em `Service`; adiciona `glpiTicketId`, `glpiTicketUrl`, `escalationLevel`, `nextRetryAt`, `lastEscalationAt` em `Incident`; adiciona `escalationChain` em `NotificationPolicy`).

- `InfraWatch2/prisma/migrations`:
  - Apenas `20250824205132_update` (antigo inicial); o conjunto de migrações não reflete o schema atual simplificado (não há migração que remova `User/Ticket/WebhookEvent` etc.).

Observação: o `InfraWatch2` está com `schema.prisma` simplificado, porém com diretório de migrações desatualizado em relação ao schema. É recomendável gerar novas migrações alinhadas ao schema atual antes de deploy.

Fila de Processamento (BullMQ)

- `InfraWatch` (antigo):
  - `jobQueue.ts` com múltiplos tipos de job: `check`, `retry`, `escalation`, `sli_evaluation`, utilitários de métricas/limpeza (`getQueueMetrics`, `cleanupOldJobs`, `purgeAllJobs`).
  - `worker.ts` com flags/robustez: `DISABLE_SCHEDULER`, limpeza condicional da fila (`CLEAR_QUEUE_ON_START`), verificação de Redis.

- `InfraWatch2` (novo):
  - `jobQueue.ts` reduzido para `enqueueServiceCheck` apenas (sem retry/escalation/SLI).
  - `worker.ts` sempre inicia o worker e o scheduler, sem as proteções/flags do anterior.

Métricas (InfluxDB)

- `InfraWatch` (antigo): gravava status com campos adicionais (ex.: `escalationLevel`, `incidentId`, `sliStatus`, `violationCount`, `response_time`, `availability`).
- `InfraWatch2` (novo): grava apenas `isUp` e `latency_ms` (além do tag `serviceId`).

Servidor e Ambiente

- Porta:
  - `InfraWatch`: `src/server.ts` usava `PORT1` (com fallback 3000).
  - `InfraWatch2`: `src/server.ts` usa `PORT` (com fallback 3000). Ajustar `.env` para refletir isso; o `InfraWatch2` ainda contém `PORT1`, mas o código lê `PORT`.

- LocalTunnel:
  - `InfraWatch`: túnel era opcional (dependia de `ENABLE_TUNNEL`).
  - `InfraWatch2`: túnel é inicializado sempre (subdomínio segue `LOCALTUNNEL_SUBDOMAIN`).

Dependências e Scripts

- `package.json`:
  - `InfraWatch` tinha scripts de banco: `migrate`, `db:push`, `seed`.
  - `InfraWatch2` removeu esses scripts; versões de dependências são praticamente equivalentes (pequena variação em `@types/node`).

Impacto Funcional

- Autenticação: rotas de login/cadastro/OTP/reset foram removidas no `InfraWatch2`. O plugin JWT permanece carregado, mas não é exposto por rotas próprias nesta versão.
- Gestão de incidentes: removidos campos e lógica de escalonamento e próximos retries.
- Políticas de notificação: removido `escalationChain` e métodos auxiliares associados.
- Serviços: criação e remoção consolidadas em `servicesRoutes`; nova rota DELETE (`/api/deleteService/:ownerId/:serviceId`).

Listas de Arquivos (diferenças relevantes em `src`)

- Apenas no `InfraWatch2` (novo):
  - `src/Controllers/APIs/deleteServices.ts`.

- Apenas no `InfraWatch` (antigo):
  - `src/Controllers/Auth/*` e `src/routes/Auth/*`.
  - `src/routes/APIs/addServiceRoutes.ts`, `src/routes/APIs/queueAdminRoutes.ts`.
  - `src/Monitoring/Incidents/escalationManager.ts`.
  - `src/Monitoring/SlaTracking/sliEvaluator.ts`.
  - `src/types/net-snmp.d.ts`.

Notas de Migração/Recomendações

- Banco de Dados (Prisma):
  - No `InfraWatch2`, gerar migrações atualizadas para refletir o schema atual (que remove `User/Ticket/WebhookEvent`, enums correlatos e campos de escalonamento/GLPI em `Incident`).
  - Atenção: remoções implicam perda de dados desses objetos/colunas. Faça backup antes de aplicar migrações destrutivas.

- Configuração/Env:
  - Atualizar `.env` para usar `PORT` (o servidor novo ignora `PORT1`).
  - Decidir se o LocalTunnel deve ser opcional; se sim, reintroduzir flag de controle (ex.: `ENABLE_TUNNEL`).

- Fila/Workers:
  - Se a estratégia de escalonamento e retries for necessária, considerar reintroduzir os jobs e utilitários removidos ou documentar a nova filosofia operacional (ex.: apenas checagens periódicas sem retries automáticos).

- Observação de segurança: os exemplos de `.env` das pastas contêm credenciais sensíveis. Trate-os como secretos e rotacione-os se tiverem sido expostos.

