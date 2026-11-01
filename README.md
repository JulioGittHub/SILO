# SILO
Sistema Integrado de Logística Operativa.

Prototipo desarrollado durante la hackatón DonWeb Day 2026.
Inspirado en la recepción de cereales de Compañía de Cereales La Pelada.

## Demo pública
http://66.97.32.143

## Qué resuelve
Centraliza el seguimiento del camión desde origen hasta su salida:
anuncio, habilitación, pesaje lleno, descarga, turno de balanza,
pesaje vacío y registro de documentación entregada.

Incluye vistas de Recepción, Balanza y patio, Secretaría y Dirección.
Calcula el peso neto y agrupa el cereal recibido por ubicación.
Conserva la trazabilidad de cada viaje y actualiza el tablero cada 5 segundos.

## Ejecución
Requiere Node.js 24.
Instalar dependencias con `npm ci`.
Iniciar con `node server.js`.
El servidor escucha en http://127.0.0.1:3000.
En el despliegue público se utiliza Nginx y un servicio systemd.

## Persistencia
Los viajes se guardan en data/camiones.json, excluido de Git.
La configuración secreta se guarda fuera del código, en .env.

## Estado y alcance
Circuito operativo probado de principio a fin con datos ficticios.
Integración de IA pendiente: el acceso provisto devuelve invalid_api_key.
Sin autenticación ni conexión física a la balanza.
Registra referencias documentales; no emite certificados oficiales.
Las toneladas recibidas no representan stock disponible:
todavía no se registran reservas ni despachos a puerto.
Usar exclusivamente datos de demostración.
