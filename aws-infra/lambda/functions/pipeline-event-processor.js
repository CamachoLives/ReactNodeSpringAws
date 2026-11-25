/**
 * AWS LAMBDA — Función serverless
 *
 * Trigger: SQS Queue (mensajes de eventos de Pipeline)
 * Patrón: Event-driven architecture + Command pattern
 * Programación funcional: handler puro, sin estado global
 *
 * Concurrencia en Lambda:
 * - Cada invocación es independiente (stateless)
 * - Escala horizontalmente de forma automática
 * - Reservas de concurrencia configurables
 */

import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Clientes reutilizados entre invocaciones (inicialización fuera del handler)
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// COMMAND PATTERN: cada tipo de evento tiene su handler
const eventHandlers = {
  PIPELINE_CREATED: handleCreated,
  PIPELINE_STARTED: handleStarted,
  PIPELINE_COMPLETED: handleCompleted,
  PIPELINE_FAILED: handleFailed,
  PIPELINE_STOPPED: handleStopped,
};

/**
 * Handler principal — punto de entrada de la Lambda
 * Procesa mensajes SQS en batch (hasta 10 por invocación)
 */
export const handler = async (event) => {
  console.log(`[Lambda] Procesando ${event.Records.length} mensajes SQS`);

  // Programación funcional: map sobre records, Promise.allSettled para paralelismo
  const results = await Promise.allSettled(
    event.Records.map(record => processRecord(record))
  );

  // Identificar mensajes fallidos para que SQS los reintente
  const failures = results
    .map((result, i) => ({ result, record: event.Records[i] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ record }) => ({ itemIdentifier: record.messageId }));

  if (failures.length > 0) {
    console.error(`[Lambda] ${failures.length} mensajes fallaron`);
  }

  // Partial batch response: SQS solo reintenta los fallidos
  return { batchItemFailures: failures };
};

async function processRecord(sqsRecord) {
  const event = JSON.parse(sqsRecord.body);
  const handler = eventHandlers[event.eventType];

  if (!handler) {
    console.warn(`[Lambda] Tipo de evento desconocido: ${event.eventType}`);
    return;
  }

  await handler(event);
}

// Handlers de eventos específicos (SRP: cada uno hace una sola cosa)

async function handleCreated(event) {
  await dynamodb.send(new PutItemCommand({
    TableName: process.env.PIPELINE_TABLE || 'nexflow-pipelines',
    Item: {
      pipelineId: { S: event.pipelineId },
      name: { S: event.pipelineName },
      status: { S: event.status },
      createdAt: { S: new Date().toISOString() }
    }
  }));
  console.log(`[Lambda] Pipeline registrado en DynamoDB: ${event.pipelineName}`);
}

async function handleStarted(event) {
  await dynamodb.send(new UpdateItemCommand({
    TableName: process.env.PIPELINE_TABLE || 'nexflow-pipelines',
    Key: { pipelineId: { S: event.pipelineId } },
    UpdateExpression: 'SET #status = :s, lastStartedAt = :t',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': { S: 'RUNNING' },
      ':t': { S: new Date().toISOString() }
    }
  }));
}

async function handleCompleted(event) {
  // Actualizar DynamoDB y notificar via SNS
  await Promise.all([
    dynamodb.send(new UpdateItemCommand({
      TableName: process.env.PIPELINE_TABLE || 'nexflow-pipelines',
      Key: { pipelineId: { S: event.pipelineId } },
      UpdateExpression: 'SET #status = :s',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': { S: 'COMPLETED' } }
    })),
    sns.send(new PublishCommand({
      TopicArn: process.env.NOTIFICATIONS_TOPIC_ARN,
      Subject: `Pipeline completado: ${event.pipelineName}`,
      Message: JSON.stringify(event)
    }))
  ]);
}

async function handleFailed(event) {
  await sns.send(new PublishCommand({
    TopicArn: process.env.NOTIFICATIONS_TOPIC_ARN,
    Subject: `⚠️ Pipeline fallido: ${event.pipelineName}`,
    Message: JSON.stringify({ ...event, alertLevel: 'HIGH' })
  }));
}

async function handleStopped(event) {
  await dynamodb.send(new UpdateItemCommand({
    TableName: process.env.PIPELINE_TABLE || 'nexflow-pipelines',
    Key: { pipelineId: { S: event.pipelineId } },
    UpdateExpression: 'SET #status = :s',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':s': { S: 'STOPPED' } }
  }));
}
