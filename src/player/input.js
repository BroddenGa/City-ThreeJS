const TECLA_DIRECCION = {
  w: 'adelante',
  s: 'atras',
  a: 'izquierda',
  d: 'derecha',
};

export function bindPlayerInput(personaje) {
  const handlers = {
    keydown(e) {
      if (personaje.entradaBloqueada) {
        personaje.setDireccion('adelante', false);
        personaje.setDireccion('atras', false);
        personaje.setDireccion('izquierda', false);
        personaje.setDireccion('derecha', false);
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'v') {
        personaje.toggleModo();
        return;
      }
      if (!personaje.modo) return;
      personaje.solicitarBloqueoMouse();
      const dir = TECLA_DIRECCION[key];
      if (dir) personaje.setDireccion(dir, true);
      if (e.code === 'Space' && !e.repeat) personaje.intentarSaltar();
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) personaje.intentarDash();
    },
    keyup(e) {
      if (personaje.entradaBloqueada) {
        personaje.setDireccion('adelante', false);
        personaje.setDireccion('atras', false);
        personaje.setDireccion('izquierda', false);
        personaje.setDireccion('derecha', false);
        return;
      }
      const dir = TECLA_DIRECCION[e.key.toLowerCase()];
      if (dir) personaje.setDireccion(dir, false);
    },
    mousemove(e) {
      personaje.aplicarMouse(e.movementX, e.movementY);
    },
    mouseleave() {
      personaje.manejarMouseFuera();
    },
    click() {
      if (personaje.entradaBloqueada) return;
      if (personaje.modo) personaje.solicitarBloqueoMouse();
    },
    pointerdown(e) {
      if (personaje.entradaBloqueada) return;
      e.preventDefault();
      if (personaje.modo) personaje.solicitarBloqueoMouse();
    },
    blur() {
      personaje.manejarBlur();
    },
    visibilitychange() {
      if (document.hidden) personaje.manejarBlur();
    },
    pointerlockchange() {
      personaje.manejarPointerlockChange();
    },
    pointerlockerror() {
      personaje.manejarPointerlockError();
    },
  };

  window.addEventListener('keydown', handlers.keydown);
  window.addEventListener('keyup', handlers.keyup);
  window.addEventListener('mousemove', handlers.mousemove);
  window.addEventListener('mouseleave', handlers.mouseleave);
  window.addEventListener('click', handlers.click);
  personaje.lockTarget?.addEventListener?.('pointerdown', handlers.pointerdown);
  window.addEventListener('blur', handlers.blur);
  document.addEventListener('visibilitychange', handlers.visibilitychange);
  document.addEventListener('pointerlockchange', handlers.pointerlockchange);
  document.addEventListener('pointerlockerror', handlers.pointerlockerror);

  return () => {
    window.removeEventListener('keydown', handlers.keydown);
    window.removeEventListener('keyup', handlers.keyup);
    window.removeEventListener('mousemove', handlers.mousemove);
    window.removeEventListener('mouseleave', handlers.mouseleave);
    window.removeEventListener('click', handlers.click);
    personaje.lockTarget?.removeEventListener?.('pointerdown', handlers.pointerdown);
    window.removeEventListener('blur', handlers.blur);
    document.removeEventListener('visibilitychange', handlers.visibilitychange);
    document.removeEventListener('pointerlockchange', handlers.pointerlockchange);
    document.removeEventListener('pointerlockerror', handlers.pointerlockerror);
  };
}
