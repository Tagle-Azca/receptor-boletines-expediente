// Servicio para guardar boletines en DynamoDB
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { REGION, TABLE_NAME } = require('../config');

const client = new DynamoDBClient({ region: REGION });
const dynamo = DynamoDBDocumentClient.from(client);

// Espera hasta que la tabla esté en estado ACTIVE
async function esperarTablaActiva() {
  process.stdout.write(`Esperando que la tabla ${TABLE_NAME} esté lista`);
  while (true) {
    const res = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    if (res.Table.TableStatus === 'ACTIVE') break;
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(' lista.');
}

// Crea la tabla si no existe y espera a que esté activa
async function inicializarTabla() {
  try {
    const res = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    if (res.Table.TableStatus !== 'ACTIVE') await esperarTablaActiva();
    else console.log(`Tabla ${TABLE_NAME} ya existe.`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`Tabla ${TABLE_NAME} creada.`);
      await esperarTablaActiva();
    } else {
      throw err;
    }
  }
}

// Guarda un boletín en DynamoDB
async function guardarBoletin({ contenido, correo, imagen }) {
  const item = {
    id:        uuidv4(),
    contenido,
    correo,
    imagen,
    leido:     false,
    creadoEn:  new Date().toISOString(),
  };

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  console.log(`Boletín guardado con id: ${item.id}`);
  return item;
}

module.exports = { inicializarTabla, guardarBoletin };
