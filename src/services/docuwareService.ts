import axios from 'axios';
import FormData from 'form-data';

const DOCUWARE_BASE_URL = process.env.DOCUWARE_BASE_URL || 'https://your-docuware-server/DocuWare/Platform';
const DOCUWARE_TOKEN = process.env.DOCUWARE_TOKEN; // JWT/OAuth2 token

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${DOCUWARE_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function getDocument(id: string) {
  const url = `${DOCUWARE_BASE_URL}/FileCabinets/Documents/${id}`;
  const response = await axios.get(url, { headers: getAuthHeaders() });
  return response.data;
}

export async function createDocument(file: Buffer, fileName: string, fileCabinetId: string, token: string) {
  const url = `${process.env.DOCUWARE_BASE_URL}/FileCabinets/${fileCabinetId}/Documents`;
  const formData = new FormData();
  formData.append('file', file, fileName);

  const response = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...formData.getHeaders(),
    },
  });
  return response.data;
}

export async function getMetadata(id: string) {
  const url = `${DOCUWARE_BASE_URL}/FileCabinets/Documents/${id}/Fields`;
  const response = await axios.get(url, { headers: getAuthHeaders() });
  return response.data;
}

export async function updateMetadata(id: string, metadata: any) {
  const url = `${DOCUWARE_BASE_URL}/FileCabinets/Documents/${id}/Fields`;
  const response = await axios.put(url, metadata, { headers: getAuthHeaders() });
  return response.data;
}