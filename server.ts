import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Participant {
  id: string;
  name: string;
  treeName: string;
  points: number;
  zone: string;
  qrCode: string;
  health: number;
  joinedAt: string;
  lastActive: string;
  isDemo?: boolean;
}

// Real-time store starting completely clean (no mock users)
let participants: Participant[] = [];

interface LiveActivity {
  id: string;
  text: string;
  timestamp: string;
}

let activities: LiveActivity[] = [];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // CORS for multi-origin if needed
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API endpoint: Get live participants ranking
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    // Sort descending by points
    const sorted = [...participants].sort((a, b) => b.points - a.points);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: sorted.length,
      participants: sorted,
      activities: activities.slice(0, 10),
    });
  });

  // API endpoint: Register or update participant in real time
  app.post('/api/leaderboard', (req: Request, res: Response) => {
    const { id, name, treeName, points, zone, qrCode, health, activityText } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Nombre es requerido' });
    }

    const participantId = id || 'rv-' + Math.random().toString(36).substring(2, 9);
    const existingIndex = participants.findIndex(
      (p) => p.id === participantId || p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      const prevPoints = participants[existingIndex].points;
      const newPoints = typeof points === 'number' ? points : prevPoints;
      const pointsDiff = newPoints - prevPoints;

      participants[existingIndex] = {
        ...participants[existingIndex],
        points: newPoints,
        treeName: treeName || participants[existingIndex].treeName,
        health: typeof health === 'number' ? health : participants[existingIndex].health,
        lastActive: new Date().toISOString(),
      };

      if (activityText) {
        activities.unshift({
          id: 'act-' + Date.now(),
          text: activityText,
          timestamp: new Date().toISOString(),
        });
      } else if (pointsDiff > 0) {
        activities.unshift({
          id: 'act-' + Date.now(),
          text: `🔥 ${name} sumó +${pointsDiff} pts (${newPoints} pts en total)`,
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        action: 'updated',
        participant: participants[existingIndex],
        activities: activities.slice(0, 10),
      });
    }

    // Create new participant
    const newParticipant: Participant = {
      id: participantId,
      name: name.trim(),
      treeName: treeName || 'Árbol ' + (name.split(' ')[0] || 'Verde'),
      points: typeof points === 'number' ? points : 50,
      zone: zone || 'Presentación En Vivo',
      qrCode: qrCode || 'RV-' + Math.floor(1000 + Math.random() * 9000),
      health: typeof health === 'number' ? health : 87,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    participants.push(newParticipant);

    activities.unshift({
      id: 'act-' + Date.now(),
      text: `🌱 ¡${newParticipant.name} se unió con ${newParticipant.treeName}! (+50 pts)`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      action: 'created',
      participant: newParticipant,
      activities: activities.slice(0, 10),
    });
  });

  // API endpoint: Reset leaderboard for fresh presentation
  app.post('/api/leaderboard/reset', (req: Request, res: Response) => {
    participants = [];
    activities = [
      { id: 'act-reset', text: '📢 Sala reiniciada. ¡Comienza el torneo!', timestamp: new Date().toISOString() }
    ];
    res.json({ success: true, message: 'Clasificación reiniciada para la presentación' });
  });

  // API endpoint: Add random mock attendees
  app.post('/api/leaderboard/seed', (req: Request, res: Response) => {
    const demoNames = [
      'Sofía Herrera',
      'Mateo Ramos',
      'Valentina Díaz',
      'Diego Morales',
      'Camila Fernández',
      'Javier Ortiz',
    ];
    const treeNames = ['Ahuehuete Milenario', 'Liquidámbar Real', 'Pino Pátula', 'Ceiba Sagrada', 'Sauce Llorón', 'Cedro Rojo'];
    
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const randomTree = treeNames[Math.floor(Math.random() * treeNames.length)];
    const newP: Participant = {
      id: 'demo-' + Date.now(),
      name: randomName + ' (Sala)',
      treeName: randomTree,
      points: Math.floor(50 + Math.random() * 70),
      zone: 'Presentación',
      qrCode: 'RV-' + Math.floor(1000 + Math.random() * 9000),
      health: Math.floor(82 + Math.random() * 16),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isDemo: true,
    };
    participants.push(newP);
    activities.unshift({
      id: 'act-' + Date.now(),
      text: `✨ ${newP.name} se unió a la sala con ${newP.treeName}`,
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, participant: newP });
  });

  // Endpoint to get raw standalone HTML string for clipboard copying
  app.get('/api/standalone-code', (req: Request, res: Response) => {
    try {
      const filePath = path.resolve(__dirname, 'raiz-viva-demo', 'index.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ success: true, html: content });
    } catch (err) {
      console.error('Error reading standalone file:', err);
      res.status(500).json({ success: false, error: 'No se pudo leer el archivo' });
    }
  });

  // Direct file download routes for index.html (standalone file for GitHub)
  app.get(['/descargar', '/download', '/api/download', '/descargar-index'], (req: Request, res: Response) => {
    const filePath = path.resolve(__dirname, 'raiz-viva-demo', 'index.html');
    res.download(filePath, 'index.html', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error al descargar el archivo');
      }
    });
  });

  // Direct standalone viewer routes
  app.get(['/raiz-viva.html', '/app-independiente', '/standalone.html', '/index-standalone.html'], (req: Request, res: Response) => {
    const filePath = path.resolve(__dirname, 'raiz-viva-demo', 'index.html');
    res.sendFile(filePath);
  });

  // Serve static standalone folder if accessed directly at /demo
  app.use('/demo', express.static(path.resolve(__dirname, 'raiz-viva-demo')));

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Raíz Viva server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
