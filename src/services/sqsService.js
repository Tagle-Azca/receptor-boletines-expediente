// Servicio para leer y eliminar mensajes de SQS
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand } = require('@aws-sdk/client-sqs');
const { REGION, QUEUE_NAME } = require('../config');

const sqs = new SQSClient({ region: REGION });
let queueUrl = null;

async function getQueueUrl() {
  if (queueUrl) return queueUrl;
  const res = await sqs.send(new GetQueueUrlCommand({ QueueName: QUEUE_NAME }));
  queueUrl = res.QueueUrl;
  return queueUrl;
}

// Obtiene hasta 1 mensaje de la cola (long polling 10s)
async function recibirMensaje() {
  const url = await getQueueUrl();
  const res = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: url,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  }));
  return res.Messages || [];
}

// Elimina el mensaje de la cola una vez procesado
async function eliminarMensaje(receiptHandle) {
  const url = await getQueueUrl();
  await sqs.send(new DeleteMessageCommand({
    QueueUrl: url,
    ReceiptHandle: receiptHandle,
  }));
}

module.exports = { recibirMensaje, eliminarMensaje };
