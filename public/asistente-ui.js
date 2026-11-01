(() => {
  const form = document.getElementById('iaForm');
  const status = document.getElementById('iaEstado');
  const answer = document.getElementById('iaRespuesta');
  const button = document.getElementById('iaEnviar');

  fetch('/api/asistente/estado', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw Error();
      return r.json();
    })
    .then(data => { status.textContent = data.mensaje; })
    .catch(() => {
      status.textContent = 'No se pudo consultar el estado del asistente.';
    });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const pregunta = document.getElementById('iaPregunta').value.trim();
    if (!pregunta) return;
    button.disabled = true;
    answer.textContent = 'Consultando…';
    try {
      const response = await fetch('/api/asistente/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta }),
        signal: AbortSignal.timeout(30000)
      });
      const data = await response.json();
      if (response.ok) status.textContent = 'Conexión verificada · Respuesta generada con IA y datos de SILO.';
      answer.textContent = response.ok
        ? String(data.respuesta).replace(/\*\*/g, '')
        : data.error || 'No se pudo obtener una respuesta.';
    } catch {
      answer.textContent = 'No se pudo conectar. Intentá nuevamente.';
    } finally {
      button.disabled = false;
    }
  });
})();
