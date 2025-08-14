import { FastifyReply, FastifyRequest } from "fastify";
import { getActivePolicyForService } from "../../repositories/policyRepo";
import { startOfMonthUTC, endOfMonthUTC } from "../../utils/time";
import { computeServiceWindow } from "../../services/windowCalculator";
import { DEFAULT_TIMEZONE } from "../../domain/constants";

export async function getSlaStatus(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const { period } = (req.query as any);
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return reply.status(400).send({ error: "Query param 'period' must be YYYY-MM" });
  const [year, month] = period.split("-").map((x: string) => parseInt(x, 10));

  const policy = await getActivePolicyForService(id);
  if (!policy) return reply.status(404).send({ error: "No active SLA policy for service" });

  const start = startOfMonthUTC(year, month, policy.timezone || DEFAULT_TIMEZONE);
  const end = endOfMonthUTC(year, month, policy.timezone || DEFAULT_TIMEZONE);
  const win = await computeServiceWindow(id, policy, start.toISOString(), end.toISOString());
  return reply.send({
    window: {
      periodStart: win.periodStart,
      periodEnd: win.periodEnd,
      availabilityPct: win.availabilityPct,
      errorBudget: {
        allowedMs: win.errorBudgetAllowedMs,
        usedMs: win.errorBudgetUsedMs,
        remainingMs: Math.max(0, win.errorBudgetAllowedMs - win.errorBudgetUsedMs),
      },
      status: win.status,
      computedAt: win.computedAt,
    }
  });
}
