/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trees,
  QrCode,
  HeartPulse,
  Droplets,
  Thermometer,
  Sun,
  FlaskConical,
  Zap,
  TriangleAlert,
  Camera,
  RotateCcw,
  Trophy,
  ListCheck,
  Recycle,
  MoreHorizontal,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Layers,
  Award,
  Download,
  Flame,
  Coffee,
  X,
  Volume2,
  Copy,
  FileCode,
  ExternalLink,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  treeName: string;
  points: number;
  zone: string;
  qrCode?: string;
  health?: number;
  isDemo?: boolean;
}

interface LiveActivity {
  id: string;
  text: string;
  timestamp: string;
}

interface Challenge {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  points: number;
  completed: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'tree' | 'ranking' | 'retos' | 'recicla' | 'layers' | 'premios' | 'sponsor'>('onboarding');
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [inputName, setInputName] = useState('');
  const [inputTreeName, setInputTreeName] = useState('');

  // Tree & Sensors State
  const [treeHealth, setTreeHealth] = useState(87);
  const [treeHeight, setTreeHeight] = useState(52);
  const [treeLevel, setTreeLevel] = useState(3);
  const [humidity, setHumidity] = useState(34);
  const [temp, setTemp] = useState(23);
  const [light, setLight] = useState(850);
  const [ph, setPh] = useState(6.5);
  const [sales, setSales] = useState(1.2);
  const [isWatered, setIsWatered] = useState(false);

  // Animation triggers
  const [isWateringAnimation, setIsWateringAnimation] = useState(false);
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const [treeBloomEffect, setTreeBloomEffect] = useState(false);
  const [floatingReward, setFloatingReward] = useState<string | null>(null);

  // Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 'c1', title: 'Guardián de la Sed', desc: 'Riega tu árbol 7 días seguidos', progress: 5, target: 7, points: 25, completed: false },
    { id: 'c2', title: 'Ojo Botánico', desc: 'Sube 3 fotos mensuales para análisis de IA', progress: 2, target: 3, points: 40, completed: false },
    { id: 'c3', title: 'Eco-Héroe', desc: 'Lleva 5 botellas PET a centro de reciclaje', progress: 3, target: 5, points: 50, completed: false },
    { id: 'c4', title: 'Comunidad Verde', desc: 'Invita a 1 amigo a adoptar un árbol', progress: 0, target: 1, points: 35, completed: false },
  ]);

  // Load state on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('rv_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setActiveTab('tree');
      }
      const savedCh = localStorage.getItem('rv_challenges');
      if (savedCh) {
        setChallenges(JSON.parse(savedCh));
      }
    } catch (e) {
      console.warn('Local storage error', e);
    }

    fetchLeaderboard();

    // Background interval to refresh live ranking every 2 seconds for audience sync
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 2000);

    let sse: EventSource | null = null;
    try {
      sse = new EventSource('https://ntfy.sh/rv_raizviva_torneo_live_2026/sse');
      sse.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const payload = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
          if (payload?.type === 'SYNC_PARTICIPANT' && payload.participant) {
            const p = payload.participant;
            setParticipants((prev) => {
              const idx = prev.findIndex((item) => item.id === p.id || item.name.trim().toLowerCase() === p.name.trim().toLowerCase());
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], ...p };
                return copy.sort((a, b) => b.points - a.points);
              } else {
                return [...prev, p].sort((a, b) => b.points - a.points);
              }
            });
          } else if (payload?.type === 'RESET_LEADERBOARD') {
            setParticipants([]);
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const triggerRewardAnimation = (text: string) => {
    setFloatingReward(text);
    setTreeBloomEffect(true);
    setTimeout(() => {
      setFloatingReward(null);
      setTreeBloomEffect(false);
    }, 2200);
  };

  const CLOUD_ROOM_URL = 'https://ntfy.sh/rv_raizviva_torneo_live_2026';

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.participants) {
          setParticipants(data.participants);
          localStorage.setItem('rv_cached_participants', JSON.stringify(data.participants));
        }
        if (data.activities) {
          setActivities(data.activities);
        }
        return;
      }
    } catch (e) {
      // offline fallback
    }

    // fallback to localStorage
    try {
      const cached = localStorage.getItem('rv_cached_participants');
      if (cached) {
        setParticipants(JSON.parse(cached));
      }
    } catch (e) {}
  };

  const syncUserToBackend = async (user: Participant, activityText?: string) => {
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, activityText }),
      });
    } catch (e) {
      // offline fallback
    }

    try {
      await fetch(CLOUD_ROOM_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: 'SYNC_PARTICIPANT',
          participant: user,
          activityText,
          timestamp: Date.now(),
        }),
      });
    } catch (e) {}

    fetchLeaderboard();
  };

  const handleCopyStandaloneHtml = async () => {
    setIsCopying(true);
    try {
      let htmlText = '';
      try {
        const res = await fetch('/api/standalone-code');
        if (res.ok) {
          const data = await res.json();
          htmlText = data.html || '';
        }
      } catch (e) {}

      if (!htmlText) {
        const res2 = await fetch('/raiz-viva.html');
        if (res2.ok) {
          htmlText = await res2.text();
        }
      }

      if (htmlText) {
        await navigator.clipboard.writeText(htmlText);
        showToast('¡Código HTML copiado! Pégalo en tu archivo index.html');
      } else {
        showToast('Usa el botón "Descargar index.html" directamente');
      }
    } catch (err) {
      console.error('Error copying code:', err);
      showToast('No se pudo acceder al portapapeles. Usa "Descargar index.html"');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const a = document.createElement('a');
    a.href = '/descargar';
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Descargando index.html para tu URL independiente 🌳');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      showToast('Por favor escribe tu nombre completo');
      return;
    }

    const randomTag = Math.floor(1000 + Math.random() * 9000);
    const newUser: Participant = {
      id: 'rv-' + Date.now().toString(36),
      name: inputName.trim(),
      treeName: inputTreeName.trim() || 'Árbol ' + inputName.trim().split(' ')[0],
      points: 50,
      zone: 'Presentación En Vivo',
      qrCode: `RV-${randomTag}`,
      health: 87,
    };

    setCurrentUser(newUser);
    localStorage.setItem('rv_current_user', JSON.stringify(newUser));
    syncUserToBackend(newUser, `🌱 ¡${newUser.name} se unió a la sala con ${newUser.treeName}! (+50 pts)`);

    setIsRegisterOpen(false);
    setInputName('');
    setInputTreeName('');
    triggerRewardAnimation('+50 pts');
    showToast(`¡Bienvenido/a ${newUser.name}! Tu árbol está en camino 🌳`);
    setActiveTab('tree');
  };

  const addPoints = (amount: number, reason: string) => {
    if (!currentUser) {
      showToast('Regístrate primero para acumular puntos');
      setIsRegisterOpen(true);
      return;
    }
    const updated = { ...currentUser, points: currentUser.points + amount };
    setCurrentUser(updated);
    localStorage.setItem('rv_current_user', JSON.stringify(updated));
    syncUserToBackend(updated, `💧 ${currentUser.name}: ${reason} (+${amount} pts)`);
    triggerRewardAnimation(`+${amount} pts`);
    showToast(`+${amount} pts: ${reason} 🎉`);
  };

  const handleWaterTree = () => {
    if (!currentUser) {
      setIsRegisterOpen(true);
      return;
    }

    // Trigger visual rain & growth animation
    setIsWateringAnimation(true);
    setTreeBloomEffect(true);

    setTimeout(() => {
      setHumidity(92);
      setIsWatered(true);
      setTreeHealth(95);
      setTreeHeight((h) => h + 2);
    }, 600);

    setTimeout(() => {
      setIsWateringAnimation(false);
      setTreeBloomEffect(false);
    }, 2500);

    addPoints(15, 'Riego y absorción de raíces verificados');
  };

  const handlePhotoTree = () => {
    if (!currentUser) {
      setIsRegisterOpen(true);
      return;
    }

    setIsScanningAnimation(true);
    showToast('Analizando follaje y ramas con IA de crecimiento... 🌿');

    setTimeout(() => {
      setIsScanningAnimation(false);
      setTreeHeight((h) => h + 4);
      setTreeLevel(4);
      showToast('¡IA confirmó +12% de biomasa y nuevo brote apical! (+30 pts)');
      addPoints(30, 'Foto mensual validada por IA');
    }, 2000);
  };

  const handleCompleteChallenge = (id: string) => {
    const ch = challenges.find((c) => c.id === id);
    if (!ch || ch.completed) return;
    const updated = challenges.map((c) => (c.id === id ? { ...c, progress: c.target, completed: true } : c));
    setChallenges(updated);
    localStorage.setItem('rv_challenges', JSON.stringify(updated));
    addPoints(ch.points, `Reto "${ch.title}" superado`);
  };

  const handleRedeem = (title: string, cost: number) => {
    if (!currentUser) {
      setIsRegisterOpen(true);
      return;
    }
    if (currentUser.points < cost) {
      showToast(`Te faltan ${cost - currentUser.points} pts para canjear este premio`);
      return;
    }
    const updated = { ...currentUser, points: currentUser.points - cost };
    setCurrentUser(updated);
    localStorage.setItem('rv_current_user', JSON.stringify(updated));
    syncUserToBackend(updated, `🎁 ${currentUser.name} canjeó "${title}" (-${cost} pts)`);
    showToast(`¡Canje exitoso! Disfruta tu ${title}`);
  };

  const handleSeedAttendee = async () => {
    try {
      const res = await fetch('/api/leaderboard/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`¡${data.participant.name} se unió a la sala!`);
        fetchLeaderboard();
        return;
      }
    } catch (e) {}

    // Fallback
    const demoNames = ['Sofía Herrera', 'Mateo Ramos', 'Valentina Díaz', 'Diego Morales', 'Camila Ortiz'];
    const rName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const newDemo: Participant = {
      id: 'demo-' + Date.now(),
      name: rName + ' (Sala)',
      treeName: 'Pino Real',
      points: Math.floor(50 + Math.random() * 60),
      zone: 'Presentación',
      isDemo: true,
    };
    const updated = [...participants, newDemo];
    setParticipants(updated);
    localStorage.setItem('rv_cached_participants', JSON.stringify(updated));
    showToast(`¡${newDemo.name} se unió a la sala!`);
  };

  const handleResetLeaderboard = async () => {
    if (!confirm('¿Deseas reiniciar la clasificación para comenzar una nueva presentación?')) return;
    try {
      await fetch('/api/leaderboard/reset', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('rv_cached_participants');
    if (currentUser) {
      const resetUser = { ...currentUser, points: 50 };
      setCurrentUser(resetUser);
      localStorage.setItem('rv_current_user', JSON.stringify(resetUser));
      setParticipants([resetUser]);
    } else {
      setParticipants([]);
    }
    showToast('Clasificación reiniciada para la presentación');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://raiz-viva.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(currentUrl)}&color=1b5e20&bgcolor=ffffff&margin=6`;

  // Sorted participants
  const sortedParticipants = [...participants].sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen bg-[#F5F9F5] flex flex-col items-center justify-start text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 z-50 max-w-sm w-11/12 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Main Container Phone / Screen Framed */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative pb-20 border-x border-slate-200">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-emerald-950 leading-tight">Raíz Viva</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supervivencia Real 🌳</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Export Standalone File Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              title="Copiar o descargar app independiente (HTML)"
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1.5 rounded-full text-[11px] font-black transition shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-700" />
              <span>HTML</span>
            </button>

            {/* User points pill */}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-extrabold transition border border-emerald-200"
            >
              <Droplets className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentUser ? currentUser.name.split(' ')[0] : 'Registrarme'}</span>
              <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full">
                {currentUser ? `${currentUser.points} pts` : '0 pts'}
              </span>
            </button>
          </div>
        </header>

        {/* Live Presentation Real-time Ticker */}
        {activities.length > 0 && (
          <div className="bg-emerald-900 text-white px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-2 overflow-hidden shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <span className="truncate font-medium">{activities[0]?.text}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. ONBOARDING */}
        {/* ======================================================== */}
        {activeTab === 'onboarding' && (
          <div className="p-6 flex flex-col items-center text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-700 mb-5 shadow-inner">
              <Trees className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 leading-tight mb-3">
              Para que los árboles no solo se planten, sino que sobrevivan
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Recibe gratis un árbol joven con sensores IoT continuos y placa QR. Monitorea su salud en tiempo real, suma puntos en vivo y ayuda a los patrocinadores a financiar su supervivencia.
            </p>

            <div className="grid grid-cols-2 gap-2.5 w-full mb-6 text-left">
              <div className="bg-[#F5F9F5] border border-emerald-200/80 p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>5 Sensores IoT</span>
              </div>
              <div className="bg-[#F5F9F5] border border-emerald-200/80 p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Visión IA Mensual</span>
              </div>
              <div className="bg-[#F5F9F5] border border-emerald-200/80 p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Ranking en Vivo</span>
              </div>
              <div className="bg-[#F5F9F5] border border-emerald-200/80 p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Pago a Supervivencia</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Registrarme y Recibir Árbol
              </button>
              <button
                onClick={() => setActiveTab('sponsor')}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Briefcase className="w-4 h-4 text-slate-500" />
                Soy Patrocinador Corporativo
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. MI ÁRBOL (CON DIBUJO Y ANIMACIÓN INTERACTIVA) */}
        {/* ======================================================== */}
        {activeTab === 'tree' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {/* Tree Hero Card with Dynamic Drawing */}
            <div className="bg-gradient-to-br from-white via-white to-emerald-50/50 border border-emerald-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              
              {/* Header Info */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {currentUser ? currentUser.treeName : 'Luna (Liquidámbar)'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-emerald-700" /> {currentUser?.qrCode || 'RV-4821'}
                    </span>
                    <span className="text-[11px] text-slate-500">Etapa: Nivel {treeLevel} ({treeHeight} cm)</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  En línea
                </span>
              </div>

              {/* DIBUJO / ANIMACIÓN DEL ÁRBOL INTERACTIVO */}
              <div className="relative w-full h-56 bg-gradient-to-b from-sky-100 via-emerald-50/60 to-emerald-100/80 rounded-2xl border border-emerald-200/80 overflow-hidden flex flex-col items-center justify-end my-2 shadow-inner select-none">
                
                {/* Floating Reward Animation */}
                {floatingReward && (
                  <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 font-black text-sm px-3.5 py-1.5 rounded-full shadow-lg border border-amber-300 animate-float-reward flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>{floatingReward}</span>
                  </div>
                )}

                {/* Laser Scan line on photo check */}
                {isScanningAnimation && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-20 animate-scanner">
                    <div className="text-[9px] font-black bg-emerald-950/80 text-emerald-200 px-2 py-0.5 rounded -mt-4 mx-auto w-max flex items-center gap-1">
                      <Camera className="w-3 h-3" /> IA: Analizando +12% crecimiento...
                    </div>
                  </div>
                )}

                {/* Falling Water Droplets Animation */}
                {isWateringAnimation && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    <div className="absolute top-2 left-1/4 text-sky-500 text-lg animate-raindrop-1">💧</div>
                    <div className="absolute top-2 left-1/3 text-sky-400 text-base animate-raindrop-2">💧</div>
                    <div className="absolute top-2 left-1/2 text-sky-500 text-xl animate-raindrop-3">💧</div>
                    <div className="absolute top-2 left-2/3 text-sky-400 text-sm animate-raindrop-4">💧</div>
                    <div className="absolute top-2 left-3/4 text-sky-500 text-lg animate-raindrop-2">💧</div>
                  </div>
                )}

                {/* Background Sun & Cloud */}
                <div className="absolute top-3 right-4 w-9 h-9 rounded-full bg-amber-300/80 shadow-[0_0_20px_#fcd34d] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
                <div className="absolute top-5 left-4 text-xs font-bold text-slate-400 opacity-60">☁️</div>

                {/* Animated Tree SVG Drawing */}
                <div className={`relative z-10 transition-transform duration-700 ${treeBloomEffect ? 'animate-bloom scale-105' : 'animate-tree-sway'}`}>
                  <svg width="220" height="175" viewBox="0 0 220 175" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Roots Underground */}
                    <path
                      d="M106 142 C95 152 75 160 55 165 M114 142 C125 152 145 160 165 165 M110 144 C110 156 112 168 110 174"
                      stroke={isWatered ? '#0284c7' : '#78350f'}
                      strokeWidth={isWatered ? '3.5' : '2.5'}
                      strokeLinecap="round"
                      className="transition-colors duration-500"
                    />

                    {/* Water glow on roots if watered */}
                    {isWatered && (
                      <circle cx="110" cy="158" r="18" fill="rgba(56, 189, 248, 0.25)" className="animate-pulse" />
                    )}

                    {/* Trunk */}
                    <path
                      d="M104 145 C102 115 100 88 110 65 C115 88 116 115 116 145 Z"
                      fill="url(#trunkGradient)"
                    />
                    {/* Branches */}
                    <path
                      d="M108 92 C90 80 72 75 60 76 M112 85 C128 75 146 72 158 74"
                      stroke="#854d0e"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />

                    {/* Main Foliage Layers */}
                    {/* Lower foliage cluster */}
                    <ellipse cx="70" cy="74" rx="28" ry="22" fill="#15803d" opacity="0.9" />
                    <ellipse cx="150" cy="72" rx="28" ry="22" fill="#15803d" opacity="0.9" />

                    {/* Central main foliage cluster */}
                    <ellipse cx="110" cy="62" rx="36" ry="30" fill="url(#leavesGradient1)" />
                    <ellipse cx="85" cy="50" rx="30" ry="26" fill="url(#leavesGradient2)" />
                    <ellipse cx="135" cy="48" rx="30" ry="26" fill="url(#leavesGradient2)" />
                    <ellipse cx="110" cy="38" rx="28" ry="24" fill="url(#leavesGradient3)" />

                    {/* Blooming flowers or fresh buds if watered */}
                    {(isWatered || treeBloomEffect) && (
                      <g className="animate-pulse">
                        <circle cx="95" cy="32" r="3.5" fill="#f43f5e" />
                        <circle cx="125" cy="35" r="3.5" fill="#fbbf24" />
                        <circle cx="68" cy="62" r="3.5" fill="#fbbf24" />
                        <circle cx="152" cy="60" r="3.5" fill="#f43f5e" />
                        <circle cx="110" cy="22" r="4" fill="#a7f3d0" />
                      </g>
                    )}

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="trunkGradient" x1="104" y1="65" x2="116" y2="145" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a16207" />
                        <stop offset="1" stopColor="#713f12" />
                      </linearGradient>
                      <linearGradient id="leavesGradient1" x1="74" y1="32" x2="146" y2="92" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#22c55e" />
                        <stop offset="1" stopColor="#15803d" />
                      </linearGradient>
                      <linearGradient id="leavesGradient2" x1="55" y1="24" x2="165" y2="76" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4ade80" />
                        <stop offset="1" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="leavesGradient3" x1="82" y1="14" x2="138" y2="62" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#86efac" />
                        <stop offset="1" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Ground Grass Line */}
                <div className="w-full h-8 bg-gradient-to-t from-[#78350f] via-[#a16207]/70 to-[#16a34a] border-t-2 border-emerald-500/80 z-10 flex items-center justify-between px-3 text-[10px] text-white font-extrabold">
                  <span className="flex items-center gap-1 drop-shadow">
                    🌱 Suelo activo: {isWatered ? 'Húmedo (92%)' : 'Seco (34%)'}
                  </span>
                  <span className="bg-emerald-950/80 px-2 py-0.5 rounded text-[9px] drop-shadow">
                    IoT Sensores 🟢
                  </span>
                </div>
              </div>

              {/* Health Score Gauge */}
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md shadow-emerald-600/20 mb-3.5">
                <div>
                  <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Salud Integral del Árbol</div>
                  <div className="text-3xl font-black">{treeHealth}%</div>
                  <div className="text-[11px] font-bold text-emerald-100">
                    {isWatered ? 'Estado óptimo tras riego (+15 pts)' : 'Vigor alto • Riego de suelo recomendado'}
                  </div>
                </div>
                <HeartPulse className="w-10 h-10 text-emerald-200" />
              </div>

              {/* Alert Banner */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors mb-3.5 ${
                  isWatered
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                }`}
              >
                {isWatered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="font-extrabold">
                    {isWatered ? '¡Riego completado con éxito!' : '¡Tu árbol necesita agua hoy!'}
                  </strong>
                  <p className="mt-0.5 text-[11px] leading-tight">
                    {isWatered
                      ? 'Los sensores confirman absorción profunda en raíz. Humedad al 92%.'
                      : 'La humedad del suelo bajó a 34%. Activa el riego para ver la animación, sumar puntos y mantener su salud.'}
                  </p>
                </div>
              </div>

              {/* 5 IoT Sensors */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" /> Humedad en Raíz
                  </span>
                  <span className={humidity < 40 ? 'text-amber-600 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                    {humidity}% {humidity < 40 ? '(Baja)' : '(Óptima)'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      humidity < 40 ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${humidity}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-700 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Temperatura
                  </span>
                  <span className="text-slate-600">{temp}°C (Óptima)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }}></div>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-700 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Radiación / Luz
                  </span>
                  <span className="text-slate-600">{light} lux</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }}></div>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-700 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" /> pH Sustrato
                  </span>
                  <span className="text-slate-600">{ph} (Balanceado)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }}></div>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-700 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Zap className="w-3.5 h-3.5 text-slate-500" /> Conductividad / Sales
                  </span>
                  <span className="text-slate-600">{sales} mS/cm</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleWaterTree}
                  className="py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Droplets className="w-4 h-4" /> Activar Riego (+15)
                </button>
                <button
                  onClick={handlePhotoTree}
                  className="py-3 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Subir Foto IA (+30)
                </button>
              </div>

              {/* Historial fotográfico */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Historial de Crecimiento Verificado
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&auto=format&fit=crop&q=60"
                      alt="Mes 1"
                      className="w-full h-14 object-cover"
                    />
                    <span className="block text-[10px] font-bold text-slate-600 py-1">Mes 1 • 25cm</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=200&auto=format&fit=crop&q=60"
                      alt="Mes 2"
                      className="w-full h-14 object-cover"
                    />
                    <span className="block text-[10px] font-bold text-slate-600 py-1">Mes 2 • 38cm</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center ring-2 ring-emerald-500">
                    <img
                      src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=60"
                      alt="Mes 3"
                      className="w-full h-14 object-cover"
                    />
                    <span className="block text-[10px] font-extrabold text-emerald-700 py-1">Mes 3 • {treeHeight}cm ✨</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. RANKING EN VIVO (COMPETICIÓN EN TIEMPO REAL) */}
        {/* ======================================================== */}
        {activeTab === 'ranking' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Tabla de Clasificación
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    En tiempo real
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {sortedParticipants.length} participantes
                  </span>
                </div>
              </div>

              <button
                onClick={fetchLeaderboard}
                title="Actualizar ranking"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
              >
                <RotateCcw className="w-3 h-3 text-emerald-700" />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Podium Top 3 */}
            {sortedParticipants.length >= 2 && (
              <div className="flex items-end justify-center gap-2 pt-4 pb-2 px-2">
                {/* 2nd place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-700 flex items-center justify-center font-extrabold text-xs -mb-2 z-10 shadow-sm">
                    🥈
                  </div>
                  <div className="w-full h-20 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-xl text-white text-center p-2 flex flex-col justify-end">
                    <span className="text-[11px] font-bold truncate block">
                      {sortedParticipants[1].name.split(' ')[0]}
                    </span>
                    <span className="text-xs font-black">{sortedParticipants[1].points} pts</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center font-black text-sm -mb-2 z-10 shadow-md">
                    👑
                  </div>
                  <div className="w-full h-24 bg-gradient-to-b from-amber-500 to-amber-600 rounded-t-xl text-white text-center p-2 flex flex-col justify-end shadow-md">
                    <span className="text-xs font-black truncate block">
                      {sortedParticipants[0].name.split(' ')[0]}
                    </span>
                    <span className="text-sm font-black">{sortedParticipants[0].points} pts</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-400 text-orange-800 flex items-center justify-center font-extrabold text-xs -mb-2 z-10 shadow-sm">
                    🥉
                  </div>
                  <div className="w-full h-16 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-xl text-white text-center p-2 flex flex-col justify-end">
                    <span className="text-[11px] font-bold truncate block">
                      {sortedParticipants[2] ? sortedParticipants[2].name.split(' ')[0] : '-'}
                    </span>
                    <span className="text-xs font-black">
                      {sortedParticipants[2] ? `${sortedParticipants[2].points} pts` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}



            {/* Empty state */}
            {sortedParticipants.length === 0 && (
              <div className="text-center py-10 px-4 bg-white border border-slate-200 rounded-xl">
                <Trees className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-80" />
                <h4 className="font-extrabold text-slate-800 text-sm">Aún no hay participantes</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3">¡Sé el primero en registrarte y tomar el podio!</p>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Registrarme
                </button>
              </div>
            )}

            {/* Ranking rows list */}
            <div className="space-y-2">
              {sortedParticipants.map((item, index) => {
                const isCurrent = currentUser && item.id === currentUser.id;
                const pos = index + 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50/90 border-emerald-400 shadow-sm ring-2 ring-emerald-400/40'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-sm text-slate-600">
                        {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900">{item.name}</span>
                          {isCurrent && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              TÚ
                            </span>
                          )}
                          {item.isDemo && (
                            <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              Sala
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {item.treeName || 'Árbol'} • {item.zone || 'Presentación'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-800">{item.points}</span>
                      <span className="text-[10px] text-slate-500 font-bold ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. RETOS */}
        {/* ======================================================== */}
        {activeTab === 'retos' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Retos y Misiones</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Completa metas de cuidado biológico para sumar puntos y ganar el torneo de la sala.
              </p>
            </div>

            <div className="space-y-3">
              {challenges.map((c) => {
                const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
                return (
                  <div key={c.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{c.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.desc}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        +{c.points} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Progreso</span>
                      <span>
                        {c.progress}/{c.target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.completed ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <button
                      onClick={() => handleCompleteChallenge(c.id)}
                      disabled={c.completed}
                      className={`w-full py-2 px-3 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        c.completed
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                      }`}
                    >
                      {c.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reto Completado
                        </>
                      ) : (
                        'Completar y reclamar puntos'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. RECICLA Y GANA */}
        {/* ======================================================== */}
        {activeTab === 'recicla' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Recicla y Gana</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Convierte plástico PET, latas y residuos en supervivencia arbórea y premios locales.
              </p>
            </div>

            {/* 4 Steps */}
            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-600" /> Flujo Visual de 4 Pasos
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                  1
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">Separa</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Junta botellas PET y aluminio limpio en casa.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                  2
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">Escanea</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Escanea el código QR del contenedor inteligente.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                  3
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">Deposita</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">La báscula IoT pesa tus kilos y suma puntos.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                  4
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">Canjea</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Obtén descuentos o patrocina un árbol extra.</p>
              </div>
            </div>

            {/* Rewards */}
            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 pt-2">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Catálogo de Canje
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-700" /> Café de Especialidad Gratis
                  </h5>
                  <span className="text-[10px] text-slate-500">En cafeterías de barrio participantes</span>
                </div>
                <button
                  onClick={() => handleRedeem('Café de Especialidad', 80)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-lg transition"
                >
                  80 pts
                </button>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-emerald-600" /> Plantar 1 Árbol Extra
                  </h5>
                  <span className="text-[10px] text-slate-500">Para tu parque o colonia vecina</span>
                </div>
                <button
                  onClick={() => handleRedeem('Árbol Comunitario', 200)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-lg transition"
                >
                  200 pts
                </button>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Kit de Composta Orgánica
                  </h5>
                  <span className="text-[10px] text-slate-500">Sustrato enriquecido de 5kg</span>
                </div>
                <button
                  onClick={() => handleRedeem('Kit de Composta', 120)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-lg transition"
                >
                  120 pts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. VERIFICACIÓN POR CAPAS */}
        {/* ======================================================== */}
        {activeTab === 'layers' && (
          <div className="p-4 space-y-3.5 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Verificación por 5 Capas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Arquitectura de supervivencia y confianza para patrocinadores institucionales.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong className="font-black">💡 Principio Fundamental:</strong>
              <p className="mt-1 text-[11px]">
                "Los sensores son un sistema de alerta temprana, no una prueba absoluta." La supervivencia real se valida con la combinación estricta de las 5 capas.
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 bg-white border border-slate-200 rounded-r-xl p-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Capa 1 • Telemetría Continua</span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">Sensores IoT en Suelo</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Monitorean humedad, temperatura, luminosidad, pH y sales para advertir estrés hídrico de inmediato.
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 bg-white border border-slate-200 rounded-r-xl p-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Capa 2 • Visión por Computadora</span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">Comparación Fotométrica con IA</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Modelos de visión comparan biomasa foliar y altura mes con mes para validar crecimiento vegetativo real.
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 bg-white border border-slate-200 rounded-r-xl p-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Capa 3 • Identidad Criptográfica</span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">Placa QR Inalterable + GPS</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Identificador físico inviolable geo-referenciado satelitalmente para evitar duplicidad de árboles.
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 bg-white border border-slate-200 rounded-r-xl p-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Capa 4 • Factor Humano</span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">Guardianes y Red de Vecinos</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Brigadas comunitarias realizan chequeos presenciales aleatorios en recorridos semanales.
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 bg-white border border-slate-200 rounded-r-xl p-3">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Capa 5 • Cierre ESG</span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">Auditoría Externa para Patrocinadores</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Muestreo independiente a los 12 meses antes de liberar el segundo pago al cuidador y brigada.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. PREMIOS */}
        {/* ======================================================== */}
        {activeTab === 'premios' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Premios y Reconocimientos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Incentivos reales para impulsar el compromiso vecinal de largo plazo.
              </p>
            </div>

            {/* Big Annual Prize */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-5 text-center shadow-sm">
              <div className="text-4xl mb-1">🏆</div>
              <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Gran Premio Anual
              </span>
              <h3 className="text-xl font-black text-amber-950 mt-2">$10,000 MXN en Fondo Verde</h3>
              <p className="text-xs text-amber-900/80 mt-1 leading-snug">
                Otorgado a la comunidad del árbol más longevo, sano y con mayor índice de supervivencia comunitaria.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-black">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Mejor Zona Metropolitana</h4>
                  <p className="text-[11px] text-slate-500">Colonia con más de 95% de supervivencia anual.</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Mayor Crecimiento Biológico</h4>
                  <p className="text-[11px] text-slate-500">Árbol con mayor índice de biomasa verificado por IA.</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-black">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Mejor Racha de Cuidado</h4>
                  <p className="text-[11px] text-slate-500">Cuidador con más meses consecutivos de fotos y riego.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 8. PANEL PATROCINADOR */}
        {/* ======================================================== */}
        {activeTab === 'sponsor' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Panel de Patrocinadores ESG</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inversión transparente con garantía de supervivencia comprobada.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-800">120</div>
                <div className="text-[11px] font-bold text-slate-500">Árboles Financiados</div>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-600">92.5%</div>
                <div className="text-[11px] font-bold text-slate-500">Tasa de Supervivencia</div>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <div className="text-2xl font-black text-sky-700">2.8 Ton</div>
                <div className="text-[11px] font-bold text-slate-500">CO₂ Capturado Est.</div>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-600">$96,000</div>
                <div className="text-[11px] font-bold text-slate-500">Inversión Comprometida</div>
              </div>
            </div>

            {/* Payment Model */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-700" /> Modelo de Pago por Supervivencia
              </h4>
              <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                $300 MXN al plantar (cubre árbol, sensor IoT y placa) + $500 MXN solo si el árbol sigue vivo al año.
              </p>
              <div className="mt-2 text-[11px] text-emerald-800">
                🛡️ Si un árbol no sobrevive los 12 meses, la empresa no paga la cuota de $500 MXN.
              </div>
            </div>

            {/* Downloadable Reports */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-800">Reportes de Auditoría Descargables</div>
              <button
                onClick={() => showToast('Descargando Reporte Ejecutivo ESG (PDF)...')}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-rose-500" /> Reporte_Impacto_ESG_2026.pdf
                </span>
                <span className="text-[10px] text-slate-400">2.4 MB</span>
              </button>
              <button
                onClick={() => showToast('Descargando Datos Raw de Sensores (CSV)...')}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" /> Sensores_Telemetria_Auditoria.csv
                </span>
                <span className="text-[10px] text-slate-400">840 KB</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM FIXED NAVIGATION */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 h-16 flex items-center justify-around z-40 px-2 shadow-lg">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
              activeTab === 'tree' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trees className="w-5 h-5" />
            <span>Mi Árbol</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ranking');
              fetchLeaderboard();
            }}
            className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition relative ${
              activeTab === 'ranking' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Ranking</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-0 right-3"></span>
          </button>

          <button
            onClick={() => setActiveTab('retos')}
            className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
              activeTab === 'retos' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ListCheck className="w-5 h-5" />
            <span>Retos</span>
          </button>

          <button
            onClick={() => setActiveTab('recicla')}
            className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
              activeTab === 'recicla' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Recycle className="w-5 h-5" />
            <span>Recicla</span>
          </button>

          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
              activeTab === 'layers' || activeTab === 'premios' || activeTab === 'sponsor'
                ? 'text-emerald-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Más</span>
          </button>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* MODAL: REGISTRO RÁPIDO */}
      {/* ======================================================== */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-700" /> Registro Rápido
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa tu nombre para unirte a la presentación en vivo. Aparecerás inmediatamente en el ranking de la sala.
            </p>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Ej. Ana Morales"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de tu Árbol (Opcional)</label>
                <input
                  type="text"
                  value={inputTreeName}
                  onChange={(e) => setInputTreeName(e.target.value)}
                  placeholder="Ej. Luna, Roble Guardián, Esperanza..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recibes 50 puntos de bienvenida y placa QR digital.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Registrarme y Ver Clasificación
              </button>
            </form>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* MODAL: SUBMENÚ "MÁS" */}
      {/* ======================================================== */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">Más Secciones</h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('layers');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center gap-3 text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Verificación por 5 Capas</div>
                  <div className="text-[10px] text-slate-500">Telemetría, IA, QR, comunidad y auditoría</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('premios');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 flex items-center gap-3 text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Premios y Reconocimientos</div>
                  <div className="text-[10px] text-slate-500">Premio anual de $10,000 MXN</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sponsor');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center gap-3 text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Panel Patrocinador ESG</div>
                  <div className="text-[10px] text-slate-500">Modelo $300 + $500 por supervivencia</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsExportModalOpen(true);
                }}
                className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 flex items-center gap-3 text-left transition"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950">Descargar / Copiar App (.html)</div>
                  <div className="text-[10px] text-amber-800 font-medium">1 solo archivo para cualquier URL o GitHub Pages</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EXPORTAR / COPIAR APP STANDALONE (1 SOLO ARCHIVO) */}
      {/* ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">App Independiente</h3>
                  <p className="text-[10px] text-emerald-800 font-bold">1 solo archivo index.html</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Esta versión tiene <strong>todo el código integrado</strong> (HTML + CSS + JavaScript + Sensores IoT + Gamificación + Audio). Solo copia y pega en un archivo <code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded text-[11px] font-mono">index.html</code> para publicarlo en cualquier URL o servidor.
            </p>

            <div className="space-y-2.5 mb-4">
              <button
                onClick={handleCopyStandaloneHtml}
                disabled={isCopying}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{isCopying ? 'Copiando código...' : 'Copiar Código HTML al Portapapeles'}</span>
              </button>

              <button
                onClick={handleDownloadStandaloneHtml}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar archivo index.html</span>
              </button>

              <a
                href="/raiz-viva.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-sky-600" />
                <span>Abrir en URL Independiente (/raiz-viva.html)</span>
              </a>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cómo usarlo en 3 pasos:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                <li>Descarga el archivo o copia el código HTML.</li>
                <li>Guárdalo como <strong className="font-mono text-slate-800">index.html</strong>.</li>
                <li>Súbelo a <strong>GitHub Pages, Vercel, Netlify</strong> o cualquier hosting web.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
