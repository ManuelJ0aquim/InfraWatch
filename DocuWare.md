# DocuWare API Connector

## Endpoints

- `GET /api/docuware/documents/:id`  
  Retorna documento pelo ID.

- `POST /api/docuware/documents`  
  Cria novo documento.

- `GET /api/docuware/documents/:id/metadata`  
  Retorna metadados do documento.

- `PUT /api/docuware/documents/:id/metadata`  
  Atualiza metadados do documento.

## Autenticação

- JWT/OAuth2 via header `Authorization: Bearer <token>`

## Testes

- Testes unitários em `src/tests/docuware.test.ts`

## Referências

- [DocuWare REST API Documentation](https://developer.docuware.com/rest/documentation.html)
- [DocuWare GitHub](https://github.com/DocuWare)