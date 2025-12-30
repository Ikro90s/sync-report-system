# Report System - Event Driven Architecture

Sistema de geração de relatórios assíncrono baseado em eventos, utilizando Node.js (TypeScript), Redis (Pub/Sub), Prisma (SQLite) e Workers dedicados.

## 📋 Arquitetura

O fluxo de execução é:

1.  **Web API (Express)**: Recebe o pedido via POST, cria um registro no banco de dados e publica o evento inicial no Redis.
2.  **Status Page**: O usuário é redirecionado para uma página que faz polling na API para acompanhar o progresso em tempo real.
3.  **Fetcher Worker**: Consome o evento, baixa dados externos (texto via Faker e imagens via Picsum) e salva localmente.
4.  **PDF Worker**: Gera um relatório PDF profissional utilizando `pdfkit`, consolidando os dados baixados.
5.  **Email Worker**: Envia o e-mail final com o PDF em anexo (Simulado via Ethereal).
6.  **DLQ (Resiliency)**: Caso ocorra uma falha no processamento (ex: erro na API externa), o sistema atualiza o status para `failed` e envia o ID para uma fila de falhas (Dead Letter Queue) para inspeção manual.

## ⚙️ Configuração do Redis

⚠️ **Atenção:** Por padrão, o projeto está configurado para conectar em uma instância de **Redis na Nuvem**, conforme definido em `src/config/redis.ts`.

### Usando Redis Local (Opcional)

Altere a URL no arquivo de configuração para `redis://localhost:6379` e suba o serviço via Docker:

```bash
docker run --name redis-local -p 6379:6379 -d redis
```

## 🚀 Instalação e Execução

1.  Instale as dependências:

    ```bash
    npm install
    ```

2.  Prepare o Banco de Dados (SQLite):

    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

3.  Execute o projeto:
    ```bash
    npm run dev
    ```

## 🧪 Como Testar

1.  Acesse `http://localhost:3000`.
2.  Preencha o e-mail e clique em "Enviar Relatório".
3.  Você será levado à **Página de Status** (`/status/:id`).
4.  Acompanhe a mudança de estados: `NEW` -> `FETCHING` -> `GEN_PDF` -> `SENDING` -> `DONE`.
5.  Quando finalizar, clique no link do **Ethereal** gerado no log do terminal para visualizar o e-mail com o anexo.
6.  _Dica:_ O Fetcher tem 30% de chance de falha simulada para testar o fluxo de erro (Status: `FAILED`).

## 🛠️ Tecnologias Utilizadas

- **TypeScript**: Tipagem estática para maior segurança.
- **Express**: Framework web para a API e interface.
- **Prisma**: ORM para persistência em SQLite.
- **Redis**: Mensageria Pub/Sub para comunicação entre workers.
- **PDFKit**: Geração dinâmica de PDFs.
- **Axios & Faker**: Coleta de dados externos e simulação.
- **Nodemailer**: Envio de e-mails com suporte a anexos.

## 📂 Estrutura de Arquivos

- `src/api.ts`: Definição de rotas e lógica da interface web.
- `src/workers/`: Lógica de cada etapa do processamento (Fetcher, PDF, Email, DLQ).
- `storage/`: Armazenamento temporário de recursos do relatório.
- `prisma/`: Schema e migrações do banco de dados.
- `public/`: Frontend estático.
