// Servicio para enviar notificaciones por SNS
const {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  ListSubscriptionsByTopicCommand,
  PublishCommand,
} = require('@aws-sdk/client-sns');
const { REGION, TOPIC_NAME, EMAIL } = require('../config');

const sns = new SNSClient({ region: REGION });
let topicArn = null;

// Crea el topic si no existe y suscribe el correo
async function inicializarSNS() {
  const res = await sns.send(new CreateTopicCommand({ Name: TOPIC_NAME }));
  topicArn = res.TopicArn;
  console.log(`Topic SNS: ${topicArn}`);

  // Verifica si el correo ya está suscrito
  const subs = await sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
  const yaExiste = subs.Subscriptions.some(
    (s) => s.Endpoint === EMAIL && s.SubscriptionArn !== 'PendingConfirmation'
  );

  if (!yaExiste) {
    await sns.send(new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: EMAIL,
    }));
    console.log(`Suscripción enviada a ${EMAIL}. Revisa tu correo para confirmar.`);
  }
}

// Envía notificación de nuevo boletín
async function notificarBoletin({ id, correo, contenido, imagen }) {
  const mensaje = `
Se ha generado un nuevo boletín en el sistema.

Destinatario: ${correo}
Contenido: ${contenido}

Ver imagen del boletín:
${imagen}

ID del boletín: ${id}
  `.trim();

  await sns.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: 'Nuevo boletín generado',
    Message: mensaje,
  }));

  console.log(`Notificación SNS enviada para boletín ${id}`);
}

module.exports = { inicializarSNS, notificarBoletin };
