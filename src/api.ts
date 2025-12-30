import express from 'express';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { publisher } from './config/redis';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota 1: Serve a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota 2: Recebe o pedido
app.post('/request-report', async (req, res) => {
  const { email } = req.body;
  
  // Cria no banco como 'new'
  const request = await prisma.request.create({ data: { email, status: 'new' } });

  // Avisa o primeiro worker
  await publisher.publish('process:fetching', request.id);

  // Redireciona para página de status
  res.redirect(`/status/${request.id}`);
});

// Rota 3: Página de Status
app.get('/status/:id', async (req, res) => {
  const { id } = req.params;
  
  const html = `
    <html>
      <head><title>Status do Pedido</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>Acompanhe seu pedido</h1>
        <p>ID: <strong>${id}</strong></p>
        <div style="font-size: 24px; margin: 20px; padding: 20px; border: 1px solid #ccc;">
            Status: <span id="status-text" style="color: blue; font-weight: bold;">Carregando...</span>
        </div>
        <a id="link" href="#" style="display:none">Voltar</a>

        <script>
          const id = "${id}";
          const statusSpan = document.getElementById('status-text');
          
          async function checkStatus() {
            try {
              const res = await fetch('/api/status/' + id);
              const data = await res.json();
              statusSpan.innerText = data.status.toUpperCase();
              
              if (data.status === 'done') {
                statusSpan.style.color = 'green';
                document.getElementById('link').style.display = 'block';
                return; // Para o polling
              }
            } catch(e) { console.error(e); }
            
            setTimeout(checkStatus, 1000); // Polling 1s
          }
          checkStatus();
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

// API JSON para o Polling
app.get('/api/status/:id', async (req, res) => {
  const request = await prisma.request.findUnique({ where: { id: req.params.id } });
  res.json({ status: request?.status || 'unknown' });
});

export { app };