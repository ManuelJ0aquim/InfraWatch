import { getDocument, createDocument, getMetadata, updateMetadata } from '../services/docuwareService';

test('getDocument retorna documento', async () => {
  const doc = await getDocument('123');
  expect(doc).toHaveProperty('id', '123');
});

test('createDocument cria documento', async () => {
  const fileBuffer = Buffer.from('Teste'); // exemplo de buffer
  const fileName = 'Teste.txt';
  const fileCabinetId = 'SEU_ID_DO_ARQUIVO'; // ajuste conforme necessário
  const token = 'SEU_TOKEN'; // ajuste conforme necessário
  const doc = await createDocument(fileBuffer, fileName, fileCabinetId, token);
  expect(doc).toHaveProperty('id');
});

test('getMetadata retorna metadados', async () => {
  const meta = await getMetadata('123');
  expect(meta).toBeDefined();
});

test('updateMetadata atualiza metadados', async () => {
  const updated = await updateMetadata('123', { key: 'value' });
  expect(updated).toBeDefined();
});