// Vercel Serverless Function: Real-time Leaderboard for Live Presentations
let participants = [];
let activities = [];

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const sorted = [...participants].sort((a, b) => b.points - a.points);
    return res.status(200).json({
      success: true,
      count: sorted.length,
      participants: sorted,
      activities: activities.slice(0, 10),
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { id, name, treeName, points, zone, qrCode, health } = body;

    // Check for reset action
    if (body.action === 'reset') {
      participants = [];
      return res.status(200).json({ success: true, message: 'Reset OK' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const participantId = id || 'rv-' + Math.random().toString(36).substring(2, 9);
    const existingIndex = participants.findIndex(
      (p) => p.id === participantId || p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      const prevPoints = participants[existingIndex].points;
      const newPoints = typeof points === 'number' ? points : prevPoints;
      participants[existingIndex] = {
        ...participants[existingIndex],
        points: newPoints,
        treeName: treeName || participants[existingIndex].treeName,
        health: typeof health === 'number' ? health : participants[existingIndex].health,
      };

      if (body.activityText) {
        activities.unshift({ id: 'act-' + Date.now(), text: body.activityText, timestamp: new Date().toISOString() });
      } else if (newPoints > prevPoints) {
        activities.unshift({ id: 'act-' + Date.now(), text: `🔥 ${name} sumó +${newPoints - prevPoints} pts`, timestamp: new Date().toISOString() });
      }

      return res.status(200).json({
        success: true,
        participant: participants[existingIndex],
        activities: activities.slice(0, 10),
      });
    }

    const newParticipant = {
      id: participantId,
      name: name.trim(),
      treeName: treeName || 'Árbol ' + name.split(' ')[0],
      points: typeof points === 'number' ? points : 50,
      zone: zone || 'Presentación En Vivo',
      qrCode: qrCode || 'RV-' + Math.floor(1000 + Math.random() * 9000),
      health: typeof health === 'number' ? health : 87,
      joinedAt: new Date().toISOString(),
    };

    participants.push(newParticipant);
    activities.unshift({
      id: 'act-' + Date.now(),
      text: `🌱 ¡${newParticipant.name} se unió con ${newParticipant.treeName}! (+50 pts)`,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      participant: newParticipant,
      activities: activities.slice(0, 10),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
