import { FastifyInstance } from "fastify";
import { processProxyData } from "../../Monitoring/Workers/worker2";
import { processSlaAndAlerts } from "../../Monitoring/Workers/slaWorker";

export async function proxyReceiverRoutes(fastify: FastifyInstance)
{
  fastify.post("/proxy-data", async (request, reply) => {
    try
    {
      const data = request.body as any;

      const issues = await processProxyData(data);

      console.log("Issues:", issues);

      for (const issue of issues)
      {
        await processSlaAndAlerts(issue.serviceId);
      }
      return { status: "ok", issues };
    }
    catch (error: any)
    {
      request.log.error(error);
      return reply.status(500).send({ status: "error", message: error.message });
    }
  });
}
