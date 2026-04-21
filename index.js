const { inicializarTabla, guardarBoletin } = require('./src/services/dynamoService');
const { inicializarSNS, notificarBoletin } = require('./src/services/snsService');
const { recibirMensaje, eliminarMensaje } = require('./src/services/sqsService');
const { POLL_INTERVAL_MS } = require('./src/config');

// Procesa un mensaje de SQS
async function procesarMensaje(mensaje) {
  const { contenido, correo, imagen } = JSON.parse(mensaje.Body);

  // 1. Guardar en DynamoDB
  const boletin = await guardarBoletin({ contenido, correo, imagen });

  // 2. Notificar por SNS
  await notificarBoletin({ id: boletin.id, correo, contenido, imagen });

  // 3. Eliminar mensaje de la cola
  await eliminarMensaje(mensaje.ReceiptHandle);

  console.log(`Mensaje procesado correctamente: ${boletin.id}`);
}

// Loop principal: poll continuo a SQS
async function iniciar() {
  console.log('Inicializando receptor de boletines...');

  await inicializarTabla();
  await inicializarSNS();

  console.log('Escuchando cola SQS...');

  while (true) {
    try {
      const mensajes = await recibirMensaje();

      for (const mensaje of mensajes) {
        await procesarMensaje(mensaje);
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err.message);
      // Espera antes de reintentar para no saturar en caso de error
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

iniciar();
