import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { getDocument, createDocument, getMetadata, updateMetadata } from '../../services/docuwareService';
import { authenticate } from '../../auth/docuwareAuth';

export async function docuwareRoutes(app: FastifyInstance) {
  const routePrefix = '/api/docuware';

  await app.register(multipart);

  app.addHook('preHandler', authenticate);

  app.get(`${routePrefix}/documents/:id`, async (req, res) => {
    const { id } = req.params as { id: string };
    return getDocument(id);
  });

  app.post(`${routePrefix}/documents`, async (req, res) => {
    return createDocument(req.body);
  });

  app.get(`${routePrefix}/documents/:id/metadata`, async (req, res) => {
    const { id } = req.params as { id: string };
    return getMetadata(id);
  });

  app.put(`${routePrefix}/documents/:id/metadata`, async (req, res) => {
    const { id } = req.params as { id: string };
    return updateMetadata(id, req.body);
  });

  app.post(`${routePrefix}/documents/upload`, async (req, res) => {
    const data = await req.file();
    if (!data) {
      return res.status(400).send({ error: 'Arquivo não enviado' });
    }

    const fileBuffer = await data.toBuffer();
    const fileName = data.filename;
    const fileCabinetId = req.body.fileCabinetId || 'SEU_ID_DO_ARQUIVO'; // ajuste conforme necessário
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const result = await createDocument(fileBuffer, fileName, fileCabinetId, token);
      return result;
    } catch (err) {
      return res.status(500).send({ error: 'Falha ao enviar documento', details: err.message });
    }
  });
}