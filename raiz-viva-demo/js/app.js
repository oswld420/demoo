/**
 * Raíz Viva - PWA Demo Application
 * Pure Vanilla JavaScript (No Frameworks)
 * Designed for Live Presentation & Real-time Audience Participation
 */

(function () {
  'use strict';

  // --- STATE ---
  const STATE = {
    currentUser: null,
    participants: [],
    sensors: {
      humidity: 34,
      temp: 23,
      light: 850,
      ph: 6.5,
      sales: 1.2,
    },
    challenges: [
      { id: 'c1', title: 'Guardián de la Sed', desc: 'Riega tu árbol 7 días seguidos', progress: 5, target: 7, points: 25, completed: false },
      { id: 'c2', title: 'Ojo Botánico', desc: 'Sube 3 fotos mensuales para análisis de IA', progress: 2, target: 3, points: 40, completed: false },
      { id: 'c3', title: 'Eco-Héroe', desc: 'Lleva 5 botellas PET a punto limpio aliado', progress: 3, target: 5, points: 50, completed: false },
      { id: 'c4', title: 'Comunidad Verde', desc: 'Invita a 1 amigo a adoptar un árbol', progress: 0, target: 1, points: 35, completed: false },
    ],
    activeTab: 'onboarding',
    isSyncing: false,
    pollInterval: null,
  };

  // BroadcastChannel for instant multi-tab sync on same machine
  let broadcastChannel = null;
  try {
    broadcastChannel = new BroadcastChannel('raiz_viva_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'LEADERBOARD_UPDATED') {
        fetchLeaderboard(false);
      }
    };
  } catch (e) {
    // BroadcastChannel unsupported or restricted
  }

  // --- DOM ELEMENTS ---
  const el = {
    tabs: document.querySelectorAll('.tab-content'),
    navBtns: document.querySelectorAll('.nav-tab-btn'),
    userNameBadge: document.getElementById('user-name-badge'),
    userPointsBadge: document.getElementById('user-points-badge'),
    registerModal: document.getElementById('register-modal'),
    registerForm: document.getElementById('register-form'),
    nameInput: document.getElementById('reg-name-input'),
    treeNameInput: document.getElementById('reg-tree-input'),
    rankingList: document.getElementById('ranking-list'),
    podiumContainer: document.getElementById('podium-container'),
    toastContainer: document.getElementById('toast-container'),
    presenterModal: document.getElementById('presenter-modal'),
    qrContainer: document.getElementById('qr-code-display'),
    waterBtn: document.getElementById('btn-water-tree'),
    photoBtn: document.getElementById('btn-photo-tree'),
    refreshRankingBtn: document.getElementById('btn-refresh-ranking'),
    seedParticipantBtn: document.getElementById('btn-seed-participant'),
    resetRankingBtn: document.getElementById('btn-reset-ranking'),
    projectorBtn: document.getElementById('btn-open-projector'),
    challengesList: document.getElementById('challenges-list'),
    sensorHumidityFill: document.getElementById('sensor-humidity-fill'),
    sensorHumidityVal: document.getElementById('sensor-humidity-val'),
    sensorAlert: document.getElementById('tree-alert-box'),
    moreSubmenuModal: document.getElementById('more-submenu-modal'),
    // Tree Animation Elements
    treeSvgWrapper: document.getElementById('tree-svg-wrapper'),
    treeRainContainer: document.getElementById('tree-rain-container'),
    treeScannerLine: document.getElementById('tree-scanner-line'),
    treeFlowers: document.getElementById('svg-tree-flowers'),
    treeFloatingReward: document.getElementById('tree-floating-reward'),
    treeFloatingText: document.getElementById('tree-floating-text'),
    treeSoilStatus: document.getElementById('tree-soil-status'),
    treeHeightLabel: document.getElementById('user-tree-height'),
    treeMonth3Label: document.getElementById('tree-month3-label'),
    liveActivityText: document.getElementById('live-activity-text'),
  };

  // --- INITIALIZATION ---
  function init() {
    loadLocalUser();
    loadLocalChallenges();
    fetchLeaderboard(true);
    setupEvents();
    renderSensors();
    renderChallenges();

    // Start background polling every 3 seconds for live phone presentations
    startLivePolling();

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // --- LOCAL STORAGE HELPERS ---
  function loadLocalUser() {
    try {
      const savedUser = localStorage.getItem('rv_current_user');
      if (savedUser) {
        STATE.currentUser = JSON.parse(savedUser);
        updateUserUI();
        switchTab('tree');
      } else {
        switchTab('onboarding');
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }

  function saveLocalUser() {
    if (STATE.currentUser) {
      localStorage.setItem('rv_current_user', JSON.stringify(STATE.currentUser));
      updateUserUI();
    }
  }

  function loadLocalChallenges() {
    try {
      const saved = localStorage.getItem('rv_challenges');
      if (saved) {
        STATE.challenges = JSON.parse(saved);
      }
    } catch (e) {}
  }

  function saveLocalChallenges() {
    localStorage.setItem('rv_challenges', JSON.stringify(STATE.challenges));
  }

  // --- SYNC & LEADERBOARD ---
  async function fetchLeaderboard(silent = false) {
    if (STATE.isSyncing) return;
    STATE.isSyncing = true;

    try {
      // First try real backend endpoint (server.ts or Vercel serverless /api/leaderboard)
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.participants && Array.isArray(data.participants)) {
          STATE.participants = data.participants;
          localStorage.setItem('rv_cached_participants', JSON.stringify(data.participants));
          if (data.activities && data.activities[0] && el.liveActivityText) {
            el.liveActivityText.textContent = data.activities[0].text;
          }
          renderRanking();
          STATE.isSyncing = false;
          if (!silent) showToast('Tabla de clasificación actualizada en vivo');
          return;
        }
      }
    } catch (err) {
      // Endpoint not reachable or offline; use local storage pool
    }

    // Fallback: Read from local storage
    try {
      const localPool = localStorage.getItem('rv_cached_participants');
      if (localPool) {
        STATE.participants = JSON.parse(localPool);
      } else {
        STATE.participants = [];
      }
    } catch (e) {}

    // Ensure current user is in local pool
    if (STATE.currentUser) {
      const idx = STATE.participants.findIndex((p) => p.id === STATE.currentUser.id);
      if (idx >= 0) {
        STATE.participants[idx] = { ...STATE.participants[idx], ...STATE.currentUser };
      } else {
        STATE.participants.push(STATE.currentUser);
      }
      localStorage.setItem('rv_cached_participants', JSON.stringify(STATE.participants));
    }

    renderRanking();
    STATE.isSyncing = false;
    if (!silent) showToast('Ranking actualizado');
  }

  async function syncUserToLeaderboard(user) {
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      // Broadcast to other tabs on same machine
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'LEADERBOARD_UPDATED' });
      }
    } catch (err) {
      // offline fallback
      let pool = [];
      try {
        pool = JSON.parse(localStorage.getItem('rv_cached_participants') || '[]');
      } catch (e) {}
      const idx = pool.findIndex((p) => p.id === user.id);
      if (idx >= 0) pool[idx] = user;
      else pool.push(user);
      localStorage.setItem('rv_cached_participants', JSON.stringify(pool));
    }

    fetchLeaderboard(true);
  }

  function startLivePolling() {
    if (STATE.pollInterval) clearInterval(STATE.pollInterval);
    STATE.pollInterval = setInterval(() => {
      fetchLeaderboard(true);
    }, 2200);
  }

  // --- UI RENDERING ---
  function updateUserUI() {
    if (!STATE.currentUser) {
      if (el.userNameBadge) el.userNameBadge.textContent = 'Sin registrar';
      if (el.userPointsBadge) el.userPointsBadge.textContent = '0 pts';
      return;
    }
    if (el.userNameBadge) el.userNameBadge.textContent = STATE.currentUser.name.split(' ')[0];
    if (el.userPointsBadge) el.userPointsBadge.textContent = `${STATE.currentUser.points} pts`;

    // Update Mi Árbol view elements
    const treeNameEl = document.getElementById('user-tree-title');
    const treeQrEl = document.getElementById('user-tree-qr');
    const healthEl = document.getElementById('user-tree-health');
    if (treeNameEl) treeNameEl.textContent = STATE.currentUser.treeName || 'Árbol Guardián';
    if (treeQrEl) treeQrEl.textContent = STATE.currentUser.qrCode || 'RV-4821';
    if (healthEl) healthEl.textContent = `${STATE.currentUser.health || 87}%`;
  }

  function renderSensors() {
    const s = STATE.sensors;
    if (el.sensorHumidityFill) el.sensorHumidityFill.style.width = `${s.humidity}%`;
    if (el.sensorHumidityVal) el.sensorHumidityVal.textContent = `${s.humidity}%`;

    const tempVal = document.getElementById('sensor-temp-val');
    const lightVal = document.getElementById('sensor-light-val');
    const phVal = document.getElementById('sensor-ph-val');
    const salesVal = document.getElementById('sensor-sales-val');

    if (tempVal) tempVal.textContent = `${s.temp}°C`;
    if (lightVal) lightVal.textContent = `${s.light} lux`;
    if (phVal) phVal.textContent = `${s.ph}`;
    if (salesVal) salesVal.textContent = `${s.sales} mS/cm`;
  }

  function renderRanking() {
    if (!el.rankingList) return;

    // Sort descending by points
    const sorted = [...STATE.participants].sort((a, b) => b.points - a.points);

    // Update count in subtitle
    const countEl = document.getElementById('ranking-count-badge');
    if (countEl) countEl.textContent = `${sorted.length} participantes`;

    // Render Top 3 Podium
    if (el.podiumContainer) {
      if (sorted.length >= 2) {
        el.podiumContainer.style.display = 'flex';
        const p1 = sorted[0];
        const p2 = sorted[1];
        const p3 = sorted[2] || { name: '-', points: 0 };

        el.podiumContainer.innerHTML = `
          <div class="podium-item podium-2">
            <div class="podium-avatar">🥈</div>
            <div class="podium-box">
              <div style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p2.name.split(' ')[0])}</div>
              <div style="font-size:14px; font-weight:900;">${p2.points} pts</div>
              <div style="font-size:10px; opacity:0.85;">2° Lugar</div>
            </div>
          </div>
          <div class="podium-item podium-1">
            <div class="podium-avatar">👑</div>
            <div class="podium-box">
              <div style="font-size:13px; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p1.name.split(' ')[0])}</div>
              <div style="font-size:16px; font-weight:900;">${p1.points} pts</div>
              <div style="font-size:11px; font-weight:800; opacity:0.95;">1° Lugar</div>
            </div>
          </div>
          <div class="podium-item podium-3">
            <div class="podium-avatar">🥉</div>
            <div class="podium-box">
              <div style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p3.name !== '-' ? escapeHtml(p3.name.split(' ')[0]) : '-'}</div>
              <div style="font-size:14px; font-weight:900;">${p3.points} pts</div>
              <div style="font-size:10px; opacity:0.85;">3° Lugar</div>
            </div>
          </div>
        `;
      } else {
        el.podiumContainer.style.display = 'none';
      }
    }

    if (sorted.length === 0) {
      el.rankingList.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: #6b7280;">
          <i class="fa-solid fa-seedling" style="font-size: 38px; color: #10b981; margin-bottom: 12px; display: block;"></i>
          <h4 style="font-size: 16px; font-weight: 800; color: #1f2937;">Aún no hay participantes</h4>
          <p style="font-size: 13px; margin-top: 4px;">¡Sé el primero en registrarte y tomar la delantera!</p>
          <button id="empty-reg-btn" class="btn-primary" style="margin-top: 16px; width: auto; padding: 8px 18px; font-size: 13px;">Registrar mi árbol</button>
        </div>
      `;
      document.getElementById('empty-reg-btn')?.addEventListener('click', openRegisterModal);
      return;
    }

    // Render list
    let html = '';
    sorted.forEach((item, index) => {
      const isCurrent = STATE.currentUser && item.id === STATE.currentUser.id;
      const rankNum = index + 1;
      let badgeIcon = `<span class="rank-position">#${rankNum}</span>`;
      if (rankNum === 1) badgeIcon = `<span class="rank-position" style="color:#d97706; font-size:18px;">🥇</span>`;
      if (rankNum === 2) badgeIcon = `<span class="rank-position" style="color:#64748b; font-size:18px;">🥈</span>`;
      if (rankNum === 3) badgeIcon = `<span class="rank-position" style="color:#b45309; font-size:18px;">🥉</span>`;

      html += `
        <div class="ranking-row ${isCurrent ? 'current-user' : ''}">
          ${badgeIcon}
          <div class="rank-user-info">
            <div class="rank-name">
              <span>${escapeHtml(item.name)}</span>
              ${isCurrent ? '<span style="background:#22c55e; color:white; font-size:10px; font-weight:800; padding:1px 6px; border-radius:10px;">TÚ</span>' : ''}
              ${item.isDemo ? '<span style="background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:700; padding:1px 5px; border-radius:8px;">Sala</span>' : ''}
            </div>
            <div class="rank-sub">${escapeHtml(item.treeName || 'Árbol')} • ${escapeHtml(item.zone || 'Presentación')}</div>
          </div>
          <div class="rank-points">${item.points} <span style="font-size:11px; font-weight:700; color:#6b7280;">pts</span></div>
        </div>
      `;
    });

    el.rankingList.innerHTML = html;
  }

  function renderChallenges() {
    if (!el.challengesList) return;

    let html = '';
    STATE.challenges.forEach((c) => {
      const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
      html += `
        <div class="challenge-item">
          <div class="challenge-top">
            <div>
              <div class="challenge-title">${escapeHtml(c.title)}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:2px;">${escapeHtml(c.desc)}</div>
            </div>
            <span class="challenge-reward">+${c.points} pts</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; color:#4b5563; margin-bottom:5px;">
            <span>Progreso</span>
            <span>${c.progress}/${c.target} (${pct}%)</span>
          </div>
          <div class="sensor-bar-bg" style="height:6px; margin-bottom:10px;">
            <div class="sensor-bar-fill ${c.completed ? 'sensor-optimal' : 'sensor-blue'}" style="width: ${pct}%;"></div>
          </div>
          <button 
            class="${c.completed ? 'btn-secondary' : 'btn-primary'} btn-challenge-action" 
            data-id="${c.id}" 
            style="padding: 7px 12px; font-size: 12px; width: 100%;"
            ${c.completed ? 'disabled' : ''}
          >
            ${c.completed ? '<i class="fa-solid fa-check"></i> Reto completado' : '¡Completar y reclamar puntos!'}
          </button>
        </div>
      `;
    });

    el.challengesList.innerHTML = html;

    // Attach click events
    document.querySelectorAll('.btn-challenge-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        completeChallenge(id);
      });
    });
  }

  // --- ACTIONS & GAMIFICATION ---
  function triggerTreeAnimation(type, pointsText) {
    // Show floating reward badge
    if (el.treeFloatingReward && pointsText) {
      if (el.treeFloatingText) el.treeFloatingText.textContent = pointsText;
      el.treeFloatingReward.classList.remove('active');
      void el.treeFloatingReward.offsetWidth; // trigger reflow
      el.treeFloatingReward.classList.add('active');
      setTimeout(() => {
        el.treeFloatingReward?.classList.remove('active');
      }, 2000);
    }

    if (el.treeSvgWrapper) {
      el.treeSvgWrapper.classList.add('tree-blooming');
      setTimeout(() => {
        el.treeSvgWrapper?.classList.remove('tree-blooming');
      }, 1400);
    }

    if (type === 'water') {
      if (el.treeRainContainer) {
        el.treeRainContainer.classList.add('active');
        setTimeout(() => {
          el.treeRainContainer?.classList.remove('active');
        }, 2500);
      }
      if (el.treeFlowers) el.treeFlowers.style.display = 'block';
      if (el.treeSoilStatus) el.treeSoilStatus.textContent = '🌱 Suelo: Húmedo y nutrido (92%)';
      const roots = document.getElementById('svg-roots-path');
      if (roots) roots.setAttribute('stroke', '#0284c7');
    }

    if (type === 'photo') {
      if (el.treeScannerLine) {
        el.treeScannerLine.classList.add('active');
        setTimeout(() => {
          el.treeScannerLine?.classList.remove('active');
        }, 2200);
      }
      if (el.treeFlowers) el.treeFlowers.style.display = 'block';
      if (el.treeHeightLabel) el.treeHeightLabel.textContent = '56 cm (+12%)';
      if (el.treeMonth3Label) el.treeMonth3Label.textContent = 'Mes 3 • 56cm ✨';
    }
  }

  function addPoints(amount, reason) {
    if (!STATE.currentUser) {
      showToast('Regístrate primero para acumular puntos');
      openRegisterModal();
      return;
    }

    STATE.currentUser.points += amount;
    saveLocalUser();
    syncUserToLeaderboard(STATE.currentUser);
    triggerTreeAnimation('point', `+${amount} pts`);
    showToast(`+${amount} pts: ${reason} 🎉`);

    // Subtle audio-like visual feedback
    const badge = el.userPointsBadge;
    if (badge) {
      badge.style.transform = 'scale(1.2)';
      badge.style.background = '#86efac';
      setTimeout(() => {
        badge.style.transform = 'scale(1)';
        badge.style.background = 'var(--primary-bg)';
      }, 300);
    }
  }

  function completeChallenge(challengeId) {
    const ch = STATE.challenges.find((c) => c.id === challengeId);
    if (!ch || ch.completed) return;

    ch.progress = ch.target;
    ch.completed = true;
    saveLocalChallenges();
    renderChallenges();
    addPoints(ch.points, `Reto "${ch.title}" superado`);
  }

  function handleWaterTree() {
    if (!STATE.currentUser) {
      openRegisterModal();
      return;
    }

    STATE.sensors.humidity = 92;
    renderSensors();

    triggerTreeAnimation('water', '+15 pts');

    if (el.sensorAlert) {
      el.sensorAlert.style.background = '#ecfdf5';
      el.sensorAlert.style.borderColor = '#a7f3d0';
      el.sensorAlert.style.color = '#065f46';
      el.sensorAlert.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#10b981; font-size:18px; margin-top:2px;"></i>
        <div>
          <strong>¡Riego activado con éxito!</strong>
          <p style="margin-top:2px; font-size:12px;">Los sensores confirman hidratación profunda en raíces (92%).</p>
        </div>
      `;
    }

    addPoints(15, 'Riego de emergencia verificado');
  }

  function handlePhotoTree() {
    if (!STATE.currentUser) {
      openRegisterModal();
      return;
    }

    triggerTreeAnimation('photo', '+30 pts');
    showToast('Analizando foto con IA de crecimiento... 🌿');

    setTimeout(() => {
      showToast('¡IA confirmó +12% de follaje nuevo y tallo vigoroso!');
      addPoints(30, 'Foto mensual validada por IA');
    }, 1500);
  }

  function handleRecycleRedeem(rewardTitle, cost) {
    if (!STATE.currentUser) {
      openRegisterModal();
      return;
    }

    if (STATE.currentUser.points < cost) {
      showToast(`Te faltan ${cost - STATE.currentUser.points} pts para este canje`);
      return;
    }

    STATE.currentUser.points -= cost;
    saveLocalUser();
    syncUserToLeaderboard(STATE.currentUser);
    showToast(`¡Canje exitoso! Disfruta tu ${rewardTitle}`);
  }

  // --- REGISTRATION MODAL ---
  function openRegisterModal() {
    if (el.registerModal) {
      el.registerModal.classList.add('open');
      if (el.nameInput) el.nameInput.focus();
    }
  }

  function closeRegisterModal() {
    if (el.registerModal) el.registerModal.classList.remove('open');
  }

  function handleRegistration(e) {
    e.preventDefault();
    const fullName = (el.nameInput?.value || '').trim();
    const treeNameCustom = (el.treeNameInput?.value || '').trim();

    if (!fullName) {
      showToast('Por favor introduce tu nombre completo');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newParticipant = {
      id: 'rv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: fullName,
      treeName: treeNameCustom || 'Árbol ' + fullName.split(' ')[0],
      points: 50, // initial points
      zone: 'Presentación En Vivo',
      qrCode: 'RV-' + randomSuffix,
      health: 87,
      joinedAt: new Date().toISOString(),
    };

    STATE.currentUser = newParticipant;
    saveLocalUser();
    syncUserToLeaderboard(newParticipant);

    closeRegisterModal();
    if (el.registerForm) el.registerForm.reset();

    showToast(`¡Bienvenido/a ${fullName}! Tu árbol está en camino 🌳`);
    switchTab('tree');
  }

  // --- NAVIGATION TABS ---
  function switchTab(tabId) {
    STATE.activeTab = tabId;

    // Hide all tabs
    el.tabs.forEach((tab) => tab.classList.remove('active'));

    // Show selected
    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Highlight nav button
    el.navBtns.forEach((btn) => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Special tab logic
    if (tabId === 'ranking') {
      fetchLeaderboard(true);
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-bell" style="color: #4ade80;"></i><span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- UTILS & QR GENERATION ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }



  // --- EVENT LISTENERS ---
  function setupEvents() {
    // Nav Tabs
    el.navBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab === 'more') {
          // Open more modal
          if (el.moreSubmenuModal) el.moreSubmenuModal.classList.add('open');
        } else {
          switchTab(tab);
        }
      });
    });

    // Submenu links inside "Más"
    document.querySelectorAll('.submenu-item').forEach((item) => {
      item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');
        if (el.moreSubmenuModal) el.moreSubmenuModal.classList.remove('open');
        switchTab(targetTab);
      });
    });

    // Modal triggers
    document.querySelectorAll('[data-action="open-register"]').forEach((btn) => {
      btn.addEventListener('click', openRegisterModal);
    });

    document.querySelectorAll('[data-action="close-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
      });
    });

    if (el.registerForm) {
      el.registerForm.addEventListener('submit', handleRegistration);
    }

    // Mi Árbol buttons
    if (el.waterBtn) el.waterBtn.addEventListener('click', handleWaterTree);
    if (el.photoBtn) el.photoBtn.addEventListener('click', handlePhotoTree);

    // Refresh ranking button
    if (el.refreshRankingBtn) {
      el.refreshRankingBtn.addEventListener('click', () => {
        el.refreshRankingBtn.querySelector('i')?.classList.add('fa-spin');
        fetchLeaderboard(false).finally(() => {
          setTimeout(() => {
            el.refreshRankingBtn.querySelector('i')?.classList.remove('fa-spin');
          }, 600);
        });
      });
    }

    // Sponsor buttons
    document.querySelectorAll('[data-action="go-sponsor"]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab('sponsor'));
    });

    // Recycle redeem buttons
    document.querySelectorAll('.btn-redeem').forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title') || 'Recompensa';
        const cost = parseInt(btn.getAttribute('data-cost') || '100', 10);
        handleRecycleRedeem(title, cost);
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
