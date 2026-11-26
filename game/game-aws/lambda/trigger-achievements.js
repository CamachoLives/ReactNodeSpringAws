/**
 * AWS LAMBDA — dispara logros tras completar una quest
 *
 * Trigger: DynamoDB Streams (stream de cambios en la tabla de scores)
 * Fan-out: publica logros en SNS → múltiples consumidores (email, push, WebSocket)
 *
 * PROGRAMACIÓN FUNCIONAL:
 * - Funciones puras para evaluar condiciones de logros
 * - map/filter sobre los registros del stream
 * - Promise.all para publicar múltiples notificaciones en paralelo
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const sns = new SNSClient({ region: process.env.AWS_REGION });
const db = new DynamoDBClient({ region: process.env.AWS_REGION });

const ACHIEVEMENTS_TOPIC = process.env.ACHIEVEMENTS_TOPIC_ARN;
const PLAYER_TABLE = process.env.PLAYER_TABLE || 'nexquest-players';

// Reglas de logros — FUNCIONAL: condiciones como predicados puros
const ACHIEVEMENT_RULES = [
  {
    id: 'PERFECT_SCORE',
    check: (score) => score.accuracy >= 1.0,
    title: 'Perfecto',
    icon: '💎',
    xpBonus: 500
  },
  {
    id: 'SPEED_DEMON',
    check: (score) => score.timeTakenMs < 60_000, // bajo 1 minuto
    title: 'Rayo',
    icon: '⚡',
    xpBonus: 300
  },
  {
    id: 'HIGH_ACCURACY',
    check: (score) => score.accuracy >= 0.9,
    title: 'Preciso',
    icon: '🎯',
    xpBonus: 200
  }
];

export const handler = async (event) => {
  // DynamoDB Streams entrega registros de cambio (INSERT, MODIFY, REMOVE)
  const newScores = event.Records
    .filter(r => r.eventName === 'INSERT')
    .map(r => unmarshall(r.dynamodb.NewImage));

  // Programación funcional: map sobre scores, filter por logros ganados
  const notifications = await Promise.all(
    newScores.map(score => evaluateAchievements(score))
  );

  // flat(): aplanar array de arrays
  const allNotifications = notifications.flat();
  console.log(`[Lambda] ${allNotifications.length} logros disparados`);

  // Publicar en paralelo
  await Promise.allSettled(
    allNotifications.map(notif => publishAchievement(notif))
  );
};

async function evaluateAchievements(score) {
  // Obtener logros ya desbloqueados por el jugador
  const { Item } = await db.send(new GetItemCommand({
    TableName: PLAYER_TABLE,
    Key: marshall({ playerId: score.playerId }),
    ProjectionExpression: 'unlockedAchievements'
  })).catch(() => ({ Item: null }));

  const unlocked = Item ? unmarshall(Item).unlockedAchievements ?? [] : [];

  // Funcional: filter + map para encontrar logros nuevos
  return ACHIEVEMENT_RULES
    .filter(rule => !unlocked.includes(rule.id)) // no tiene el logro aún
    .filter(rule => rule.check(score))            // cumple la condición
    .map(rule => ({ ...rule, playerId: score.playerId, timestamp: new Date().toISOString() }));
}

async function publishAchievement(achievement) {
  return sns.send(new PublishCommand({
    TopicArn: ACHIEVEMENTS_TOPIC,
    Subject: `🏆 Logro desbloqueado: ${achievement.title}`,
    Message: JSON.stringify(achievement),
    MessageAttributes: {
      achievementId: { DataType: 'String', StringValue: achievement.id },
      playerId: { DataType: 'String', StringValue: achievement.playerId }
    }
  }));
}
