/**
 * AWS LAMBDA — guarda scores del juego en DynamoDB
 *
 * Trigger: API Gateway (POST /game/scores)
 * Pattern: Command (cada acción del juego es un comando)
 * DynamoDB: tabla con sort key para historial de scores
 * Concurrencia Lambda: invocaciones paralelas son naturalmente stateless
 */

import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const db = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

const SCORES_TABLE = process.env.SCORES_TABLE || 'nexquest-scores';
const LEADERBOARD_TABLE = process.env.LEADERBOARD_TABLE || 'nexquest-leaderboard';

/**
 * Handler principal
 * Recibe: { playerId, questId, xpEarned, score, accuracy, timeTakenMs }
 */
export const handler = async (event) => {
  const body = JSON.parse(event.body ?? '{}');

  try {
    const result = await saveScore(body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('[Lambda] Error guardando score:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

/**
 * Guarda score individual Y actualiza leaderboard en una transacción.
 * DynamoDB Transactions: ambas escrituras son atómicas (todo o nada).
 */
async function saveScore({ playerId, questId, xpEarned, score, accuracy, timeTakenMs }) {
  const timestamp = new Date().toISOString();
  const scoreId = `${playerId}#${questId}#${timestamp}`;

  // TransactWrite: escritura atómica en dos tablas
  await db.send(new TransactWriteItemsCommand({
    TransactItems: [
      // 1. Guardar registro del score
      {
        Put: {
          TableName: SCORES_TABLE,
          Item: marshall({
            playerId,
            scoreId,
            questId,
            xpEarned,
            score,
            accuracy,
            timeTakenMs,
            timestamp
          })
        }
      },
      // 2. Actualizar leaderboard con score acumulado
      {
        Update: {
          TableName: LEADERBOARD_TABLE,
          Key: marshall({ playerId }),
          UpdateExpression: 'ADD totalScore :s, totalXp :x, questsCompleted :q SET lastActive = :t',
          ExpressionAttributeValues: marshall({
            ':s': score,
            ':x': xpEarned,
            ':q': 1,
            ':t': timestamp
          })
        }
      }
    ]
  }));

  // Consultar posición actual en el leaderboard (top 100 por GSI)
  const { Items } = await db.send(new QueryCommand({
    TableName: LEADERBOARD_TABLE,
    IndexName: 'score-index',
    KeyConditionExpression: 'gameId = :g',
    ExpressionAttributeValues: marshall({ ':g': 'GLOBAL' }),
    ScanIndexForward: false, // descendente
    Limit: 100
  })).catch(() => ({ Items: [] }));

  const rank = (Items ?? []).findIndex(item => unmarshall(item).playerId === playerId) + 1;

  return { saved: true, rank: rank || null, timestamp };
}
