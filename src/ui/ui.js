import {
  BEST_TIME_KEY,
  MOUSE_SENSIBILIDAD_DEFAULT,
  MOUSE_SENSIBILIDAD_FIREFOX,
  MOUSE_SENSIBILIDAD_BRAVE,
  MOUSE_SENSIBILIDAD_KEY,
  MOUSE_SENSIBILIDAD_MAX,
  MOUSE_SENSIBILIDAD_MIN,
  MOUSE_SENSIBILIDAD_UI_STEP,
} from '../world/config.js';

export function createUI({ personaje, onPlay, onPause, onResume, getPaused, getFinished }) {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.9);font-family:monospace;color:#fff;';
  loadingOverlay.innerHTML = `
  <section style="width:min(420px,calc(100vw - 32px));text-align:center;">
    <div style="font-size:13px;color:#4FC3F7;letter-spacing:0;text-transform:uppercase;margin-bottom:10px;">Generando maze</div>
    <h1 id="loading-title" style="font-size:30px;line-height:1.1;margin:0 0 12px;color:#fff;letter-spacing:0;">Cargando nivel</h1>
    <div id="loading-detail" style="font-size:14px;color:#c8d3e3;">Preparando rutas alternativas</div>
  </section>`;
  document.body.appendChild(loadingOverlay);

  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:10px;left:0;width:100%;display:flex;justify-content:center;pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
  hud.style.display = 'none';
  hud.innerHTML = `
  <div style="width:min(646px,calc(100vw - 20px));background:rgba(5,9,16,0.68);border:1px solid rgba(255,255,255,0.14);border-radius:7px;padding:8px 10px;box-shadow:0 8px 24px rgba(0,0,0,0.24);backdrop-filter:blur(7px);">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;">
      <div style="font-weight:bold;font-size:13px;letter-spacing:0;color:#fff;"><span style="color:#4FC3F7;">S</span> RE-MAZE <span style="color:#FFD700;">META</span></div>
      <div id="hud-estado" style="display:flex;align-items:center;gap:5px;color:#c8d3e3;font-size:10px;"><span id="hud-estado-dot" style="width:7px;height:7px;border-radius:50%;background:#8BC34A;box-shadow:0 0 8px rgba(139,195,74,0.8);"></span><span id="hud-estado-texto">SUELO</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(76px,1fr));gap:7px;">
      <div style="background:rgba(255,255,255,0.065);border-radius:5px;padding:7px 8px;min-height:44px;">
        <div style="font-size:9px;color:#93a6bd;margin-bottom:3px;">TIEMPO</div>
        <div id="hud-tiempo" style="font-size:18px;font-weight:bold;color:#fff;line-height:1;">00:00.00</div>
      </div>
      <div style="background:rgba(255,255,255,0.065);border-radius:5px;padding:7px 8px;min-height:44px;">
        <div style="font-size:9px;color:#93a6bd;margin-bottom:3px;">MEJOR</div>
        <div id="hud-mejor" style="font-size:15px;font-weight:bold;color:#FFD700;line-height:1.1;">--:--.--</div>
      </div>
      <div style="background:rgba(255,255,255,0.065);border-radius:5px;padding:7px 8px;min-height:44px;">
        <div style="font-size:9px;color:#93a6bd;margin-bottom:3px;">SALTOS</div>
        <div id="hud-saltos" style="font-size:15px;font-weight:bold;color:#8BC34A;line-height:1.1;">1/1</div>
      </div>
      <div style="background:rgba(255,255,255,0.065);border-radius:5px;padding:7px 8px;min-height:44px;">
        <div style="font-size:9px;color:#93a6bd;margin-bottom:3px;">DASH</div>
        <div id="hud-dash" style="font-size:15px;font-weight:bold;color:#8BC34A;line-height:1.1;">LISTO</div>
        <div style="height:3px;background:rgba(255,255,255,0.12);border-radius:999px;margin-top:6px;overflow:hidden;">
          <div id="hud-dash-bar" style="height:100%;width:100%;background:#4FC3F7;transform-origin:left center;transform:scaleX(1);"></div>
        </div>
      </div>
    </div>
    <div style="margin-top:6px;font-size:9px;color:#9fb0c4;text-align:center;">WASD mover &nbsp; SPACE saltar &nbsp; SHIFT dash &nbsp; V camara</div>
  </div>`;
  document.body.appendChild(hud);

  const lockNotice = document.createElement('div');
  lockNotice.id = 'mouse-lock-notice';
  lockNotice.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:18;display:none;pointer-events:none;font-family:monospace;color:#fff;background:rgba(5,9,16,0.76);border:1px solid rgba(255,255,255,0.18);border-radius:6px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,0.28);';
  lockNotice.textContent = 'Click en la pantalla para capturar el mouse';
  document.body.appendChild(lockNotice);

  const pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'pause-overlay';
  pauseOverlay.style.cssText = 'position:fixed;inset:0;z-index:35;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.62);font-family:monospace;color:#fff;';
  pauseOverlay.innerHTML = `
  <section aria-labelledby="pause-title" style="width:min(360px,calc(100vw - 32px));background:rgba(12,18,30,0.9);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,0.45);text-align:center;">
    <h2 id="pause-title" style="font-size:30px;line-height:1;margin:0 0 18px;color:#fff;letter-spacing:0;">Pausa</h2>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button id="pause-resume" type="button" style="min-width:140px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Continuar</button>
      <button id="pause-config" type="button" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Configuracion</button>
    </div>
  </section>`;
  document.body.appendChild(pauseOverlay);

  const configOverlay = document.createElement('div');
  configOverlay.id = 'config-overlay';
  configOverlay.style.cssText = 'position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.7);font-family:monospace;color:#fff;';
  configOverlay.innerHTML = `
  <section aria-labelledby="config-title" style="width:min(460px,calc(100vw - 32px));background:rgba(12,18,30,0.94);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,0.45);">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
      <h2 id="config-title" style="font-size:28px;line-height:1;margin:0;color:#fff;letter-spacing:0;">Configuracion</h2>
      <button id="config-close" type="button" aria-label="Cerrar configuracion" style="width:38px;height:38px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-size:20px;line-height:1;cursor:pointer;">x</button>
    </div>
    <div style="display:grid;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <label for="config-sensibilidad" style="font-size:13px;color:#c8d3e3;">Sensibilidad del mouse</label>
        <div id="config-sensibilidad-value" style="min-width:42px;text-align:right;font-size:18px;font-weight:bold;color:#4FC3F7;">2.2</div>
      </div>
      <input id="config-sensibilidad" type="range" min="${MOUSE_SENSIBILIDAD_MIN * 1000}" max="${MOUSE_SENSIBILIDAD_MAX * 1000}" step="${MOUSE_SENSIBILIDAD_UI_STEP}" value="${MOUSE_SENSIBILIDAD_DEFAULT * 1000}" style="width:100%;accent-color:#4FC3F7;">
      <div id="config-sensibilidad-profile" style="font-size:12px;color:#93a6bd;">Auto: default</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:22px;">
      <button id="config-reset" type="button" style="min-width:130px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:15px;padding:10px 14px;cursor:pointer;">Restablecer</button>
      <button id="config-done" type="button" style="min-width:130px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:15px;padding:10px 14px;cursor:pointer;">Listo</button>
    </div>
  </section>`;
  document.body.appendChild(configOverlay);

  const menuPrincipal = document.createElement('div');
  menuPrincipal.id = 'menu-principal';
  menuPrincipal.style.cssText = 'position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.78);font-family:monospace;color:#fff;transition:opacity 0.28s ease;';
  menuPrincipal.innerHTML = `
  <section aria-labelledby="menu-title" style="width:min(520px,calc(100vw - 32px));background:rgba(12,18,30,0.88);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:28px;box-shadow:0 18px 60px rgba(0,0,0,0.45);">
    <div style="font-size:13px;color:#4FC3F7;letter-spacing:0;text-transform:uppercase;margin-bottom:8px;">Parkour 3D</div>
    <h1 id="menu-title" style="font-size:38px;line-height:1.05;margin:0 0 12px;color:#fff;letter-spacing:0;">re-maze</h1>
    <p style="margin:0 0 22px;color:#c8d3e3;font-size:15px;line-height:1.5;">Llega a la meta usando saltos, dash y plataformas.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      <button id="menu-jugar" type="button" style="min-width:140px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Jugar</button>
      <button id="menu-config" type="button" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Configuracion</button>
      <button id="menu-controles" type="button" aria-expanded="false" aria-controls="menu-controles-panel" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Controles</button>
    </div>
    <div id="menu-controles-panel" hidden style="border-top:1px solid rgba(255,255,255,0.14);padding-top:16px;color:#dce7f5;font-size:14px;line-height:1.7;">
      <div><b>WASD</b> - Moverse</div>
      <div><b>Mouse</b> - Mirar alrededor</div>
      <div><b>Space</b> - Saltar y doble salto</div>
      <div><b>Shift</b> - Dash</div>
      <div><b>V</b> - Alternar camara</div>
    </div>
  </section>`;
  document.body.appendChild(menuPrincipal);

  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:45%;width:100%;text-align:center;color:#FFD700;font-family:monospace;font-size:28px;font-weight:bold;pointer-events:none;text-shadow:0 0 30px rgba(255,215,0,0.5);opacity:0;transition:opacity 0.6s;z-index:20;';
  msg.textContent = 'LLEGASTE A LA META!';
  document.body.appendChild(msg);

  const flashDiv = document.createElement('div');
  flashDiv.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,0.15);pointer-events:none;opacity:0;transition:opacity 0.3s;z-index:15;';
  document.body.appendChild(flashDiv);

  const hudTiempo = document.getElementById('hud-tiempo');
  const hudMejor = document.getElementById('hud-mejor');
  const hudSaltos = document.getElementById('hud-saltos');
  const hudDash = document.getElementById('hud-dash');
  const hudDashBar = document.getElementById('hud-dash-bar');
  const hudEstadoDot = document.getElementById('hud-estado-dot');
  const hudEstadoTexto = document.getElementById('hud-estado-texto');
  const pauseResumeBtn = document.getElementById('pause-resume');
  const pauseConfigBtn = document.getElementById('pause-config');
  const configCloseBtn = document.getElementById('config-close');
  const configDoneBtn = document.getElementById('config-done');
  const configResetBtn = document.getElementById('config-reset');
  const configSensibilidad = document.getElementById('config-sensibilidad');
  const jugarBtn = document.getElementById('menu-jugar');
  const menuConfigBtn = document.getElementById('menu-config');
  const controlesBtn = document.getElementById('menu-controles');
  const controlesPanel = document.getElementById('menu-controles-panel');

  let tiempoInicio = 0;
  let tiempoActual = 0;
  let cronometroActivo = false;
  let mejorTiempo = leerMejorTiempo();
  let perfilSensibilidadMouse = 'default';
  let perfilSensibilidadBase = 'default';
  let sensibilidadMouseBase = MOUSE_SENSIBILIDAD_DEFAULT;
  let configuracionAbierta = false;
  let mouseBloqueadoDuranteJuego = false;
  let levelListo = false;

  function tiempoPartidaActual() {
    if (!cronometroActivo) return tiempoActual;
    return performance.now() / 1000 - tiempoInicio;
  }

  function iniciarCronometro() {
    tiempoInicio = performance.now() / 1000;
    tiempoActual = 0;
    cronometroActivo = true;
    actualizarHud();
  }

  function detenerCronometro() {
    tiempoActual = tiempoPartidaActual();
    cronometroActivo = false;
    return tiempoActual;
  }

  function pausarCronometro() {
    tiempoActual = tiempoPartidaActual();
    cronometroActivo = false;
    actualizarHud();
  }

  function reanudarCronometro() {
    tiempoInicio = performance.now() / 1000 - tiempoActual;
    cronometroActivo = true;
    actualizarHud();
  }

  function registrarMeta() {
    const tiempoFinal = detenerCronometro();
    const nuevoRecord = mejorTiempo === null || tiempoFinal < mejorTiempo;
    if (nuevoRecord) {
      mejorTiempo = tiempoFinal;
      guardarMejorTiempo(tiempoFinal);
    }
    return { tiempoFinal, nuevoRecord };
  }

  function formatearTiempo(segundos) {
    const totalCent = Math.max(0, Math.floor(segundos * 100));
    const min = Math.floor(totalCent / 6000);
    const sec = Math.floor((totalCent % 6000) / 100);
    const cent = totalCent % 100;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
  }

  function leerMejorTiempo() {
    const value = Number(localStorage.getItem(BEST_TIME_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function guardarMejorTiempo(value) {
    localStorage.setItem(BEST_TIME_KEY, String(value));
  }

  function limitarSensibilidadMouse(value) {
    const sensibilidad = Number(value);
    if (!Number.isFinite(sensibilidad)) return MOUSE_SENSIBILIDAD_DEFAULT;
    return Math.min(MOUSE_SENSIBILIDAD_MAX, Math.max(MOUSE_SENSIBILIDAD_MIN, sensibilidad));
  }

  function sensibilidadDesdeControl(value) {
    return limitarSensibilidadMouse(Number(value) / 1000);
  }

  function sensibilidadParaControl(value) {
    return (limitarSensibilidadMouse(value) * 1000).toFixed(1);
  }

  function leerSensibilidadGuardada() {
    const sensibilidad = Number(localStorage.getItem(MOUSE_SENSIBILIDAD_KEY));
    return Number.isFinite(sensibilidad) ? limitarSensibilidadMouse(sensibilidad) : null;
  }

  function actualizarControlSensibilidad() {
    if (!configSensibilidad) return;
    const value = document.getElementById('config-sensibilidad-value');
    const profile = document.getElementById('config-sensibilidad-profile');
    if (!value || !profile) return;
    configSensibilidad.value = sensibilidadParaControl(personaje.sensibilidadMouse);
    value.textContent = sensibilidadParaControl(personaje.sensibilidadMouse);
    profile.textContent = perfilSensibilidadMouse === 'personalizada'
      ? 'Personalizada'
      : `Auto: ${perfilSensibilidadMouse}`;
  }

  function aplicarSensibilidadMouse(perfil, sensibilidad, { guardar = false } = {}) {
    perfilSensibilidadMouse = perfil;
    personaje.sensibilidadMouse = limitarSensibilidadMouse(sensibilidad);
    if (guardar) localStorage.setItem(MOUSE_SENSIBILIDAD_KEY, String(personaje.sensibilidadMouse));
    actualizarControlSensibilidad();
  }

  function restablecerSensibilidadMouse() {
    localStorage.removeItem(MOUSE_SENSIBILIDAD_KEY);
    aplicarSensibilidadMouse(perfilSensibilidadBase, sensibilidadMouseBase);
  }

  async function configurarSensibilidadMouse() {
    const userAgent = navigator.userAgent;
    let perfil = 'default';
    let sensibilidad = MOUSE_SENSIBILIDAD_DEFAULT;

    if (/Firefox\//.test(userAgent)) {
      perfil = 'firefox';
      sensibilidad = MOUSE_SENSIBILIDAD_FIREFOX;
    }

    try {
      const esBrave = await navigator.brave?.isBrave?.();
      if (esBrave) {
        perfil = 'brave';
        sensibilidad = MOUSE_SENSIBILIDAD_BRAVE;
      }
    } catch {
      // Mantiene el perfil ya detectado si Brave no expone su API.
    }

    perfilSensibilidadBase = perfil;
    sensibilidadMouseBase = sensibilidad;

    const sensibilidadGuardada = leerSensibilidadGuardada();
    if (sensibilidadGuardada !== null) {
      aplicarSensibilidadMouse('personalizada', sensibilidadGuardada);
      return;
    }

    aplicarSensibilidadMouse(perfil, sensibilidad);
  }

  function abrirConfiguracion() {
    configuracionAbierta = true;
    actualizarControlSensibilidad();
    configOverlay.style.display = 'flex';
  }

  function cerrarConfiguracion() {
    configuracionAbierta = false;
    configOverlay.style.display = 'none';
  }

  function actualizarHud() {
    hudTiempo.textContent = formatearTiempo(tiempoPartidaActual());
    hudMejor.textContent = mejorTiempo === null ? '--:--.--' : formatearTiempo(mejorTiempo);
    hudSaltos.textContent = `${personaje._saltosRestantes}/${personaje._saltosMax}`;

    const dashRestante = Math.max(0, personaje._dashCooldown);
    const dashTotal = personaje._dashTiempoRecarga || 1;
    const dashListo = dashRestante <= 0;
    hudDash.textContent = dashListo ? 'LISTO' : `${dashRestante.toFixed(1)}s`;
    hudDash.style.color = dashListo ? '#8BC34A' : '#FFD166';
    hudDashBar.style.transform = `scaleX(${dashListo ? 1 : 1 - Math.min(1, dashRestante / dashTotal)})`;

    let estadoTexto = 'AIRE';
    let estadoColor = '#90CAF9';
    if (personaje.enSuelo) {
      estadoTexto = 'SUELO';
      estadoColor = '#8BC34A';
    } else if (personaje._enPared) {
      estadoTexto = 'PARED';
      estadoColor = '#FFB74D';
    }
    hudEstadoTexto.textContent = estadoTexto;
    hudEstadoDot.style.background = estadoColor;
    hudEstadoDot.style.boxShadow = `0 0 10px ${estadoColor}`;

    const necesitaMouse = state.juegoIniciado && !state.juegoPausado && personaje.modo && !personaje.estaMouseBloqueado();
    lockNotice.style.display = necesitaMouse ? 'block' : 'none';
  }

  const state = {
    juegoIniciado: false,
    juegoPausado: false,
  };

  controlesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = !controlesPanel.hidden;
    controlesPanel.hidden = visible;
    controlesBtn.setAttribute('aria-expanded', String(!visible));
  });

  menuConfigBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    abrirConfiguracion();
  });

  pauseResumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onResume();
  });

  pauseConfigBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    abrirConfiguracion();
  });

  configSensibilidad.addEventListener('input', () => {
    aplicarSensibilidadMouse('personalizada', sensibilidadDesdeControl(configSensibilidad.value), { guardar: true });
  });

  configResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    restablecerSensibilidadMouse();
  });

  configCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarConfiguracion();
  });

  configDoneBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarConfiguracion();
  });

  configOverlay.addEventListener('pointerdown', (e) => {
    if (e.target === configOverlay) cerrarConfiguracion();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (configuracionAbierta) {
      e.preventDefault();
      e.stopPropagation();
      cerrarConfiguracion();
      return;
    }
    if (!state.juegoIniciado) return;
    e.preventDefault();
    e.stopPropagation();
    if (getPaused()) onResume();
    else onPause();
  }, true);

  document.addEventListener('pointerlockchange', () => {
    if (!state.juegoIniciado || getPaused() || !personaje.modo) return;
    if (personaje.estaMouseBloqueado()) {
      mouseBloqueadoDuranteJuego = true;
      return;
    }
    if (mouseBloqueadoDuranteJuego) {
      onPause();
    }
  });

  jugarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!levelListo) return;
    if (state.juegoIniciado) return;
    state.juegoIniciado = true;
    mouseBloqueadoDuranteJuego = false;
    personaje.entradaBloqueada = false;
    pauseOverlay.style.display = 'none';
    hud.style.display = 'flex';
    onPlay();
    iniciarCronometro();
    personaje.activar();
    menuPrincipal.style.opacity = '0';
    menuPrincipal.style.pointerEvents = 'none';
    setTimeout(() => menuPrincipal.remove(), 320);
  });

  configurarSensibilidadMouse();

  function onPauseInternal() {
    state.juegoPausado = true;
    pausarCronometro();
    pauseOverlay.style.display = 'flex';
    lockNotice.style.display = 'none';
  }

  function onResumeInternal() {
    state.juegoPausado = false;
    pauseOverlay.style.display = 'none';
    reanudarCronometro();
  }

  function setFinishedMessage({ tiempoFinal, nuevoRecord }) {
    msg.innerHTML = `LLEGASTE A LA META!<br><span style="font-size:18px;color:#fff;">Tiempo ${formatearTiempo(tiempoFinal)}${nuevoRecord ? ' - NUEVO RECORD' : ''}</span>`;
    msg.style.opacity = '1';
  }

  function hideFinishedMessage() {
    msg.style.opacity = '0';
  }

  return {
    state,
    actualizarHud,
    iniciarCronometro,
    registrarMeta,
    mostrarFlash(valor) {
      flashDiv.style.opacity = Math.min(1, valor);
    },
    mostrarFlashForzado(valor) {
      flashDiv.style.opacity = valor ? '1' : '0';
    },
    setFinishedMessage,
    hideFinishedMessage,
    getPerfilSensibilidad() {
      return perfilSensibilidadMouse;
    },
    aplicarSensibilidadMouse,
    limitarSensibilidadMouse,
    setLoading(visible, detail = 'Preparando rutas alternativas') {
      loadingOverlay.style.display = visible ? 'flex' : 'none';
      const loadingDetail = document.getElementById('loading-detail');
      if (loadingDetail) loadingDetail.textContent = detail;
    },
    setMenuReady(ready) {
      levelListo = ready;
      jugarBtn.disabled = !ready;
      jugarBtn.style.opacity = ready ? '1' : '0.55';
      jugarBtn.style.cursor = ready ? 'pointer' : 'wait';
    },
    showMenu() {
      menuPrincipal.style.display = 'flex';
    },
    onPauseInternal,
    onResumeInternal,
  };
}
