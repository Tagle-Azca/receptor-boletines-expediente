// Configuración central del receptor
const REGION = process.env.AWS_REGION || 'us-east-1';
const EXPEDIENTE = '739678';

module.exports = {
  REGION,
  QUEUE_NAME:  'cola-boletines',
  TABLE_NAME:  `boletines-${EXPEDIENTE}`,
  TOPIC_NAME:  `notificaciones-boletines-${EXPEDIENTE}`,
  EMAIL:       process.env.SNS_EMAIL || 'andres.gomeztagle@iteso.mx',
  POLL_INTERVAL_MS: 5000,   // cada 5 segundos revisa la cola
};
