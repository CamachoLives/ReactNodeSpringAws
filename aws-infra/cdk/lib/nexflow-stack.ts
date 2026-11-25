/**
 * AWS CDK — Infrastructure as Code en TypeScript
 *
 * Define toda la infraestructura como código:
 * - SQS FIFO Queue para eventos de pipelines
 * - SNS Topic para notificaciones
 * - DynamoDB Table para estado de pipelines
 * - Lambda para procesar eventos
 * - S3 Bucket para almacenar datos ETL
 * - RDS PostgreSQL para la base de datos principal
 */

import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs_event_source from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class NexflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─────────────────────────────────────────
    // VPC — red privada para recursos internos
    // ─────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'NexflowVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // ─────────────────────────────────────────
    // S3 — almacenamiento de datos ETL
    // ─────────────────────────────────────────
    const dataBucket = new s3.Bucket(this, 'NexflowDataBucket', {
      bucketName: `nexflow-data-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        id: 'archive-old-data',
        transitions: [{
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90)
        }]
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // ─────────────────────────────────────────
    // SQS FIFO — cola de eventos de pipelines
    // ─────────────────────────────────────────
    const deadLetterQueue = new sqs.Queue(this, 'NexflowDLQ', {
      queueName: 'nexflow-events-dlq.fifo',
      fifo: true,
      retentionPeriod: cdk.Duration.days(14)
    });

    const pipelineEventsQueue = new sqs.Queue(this, 'PipelineEventsQueue', {
      queueName: 'nexflow-events.fifo',
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3 // reintentar 3 veces antes de DLQ
      }
    });

    // ─────────────────────────────────────────
    // SNS — notificaciones
    // ─────────────────────────────────────────
    const notificationsTopic = new sns.Topic(this, 'NexflowNotifications', {
      topicName: 'nexflow-notifications',
      displayName: 'NexFlow Pipeline Notifications'
    });

    // ─────────────────────────────────────────
    // DynamoDB — estado de pipelines (NoSQL)
    // ─────────────────────────────────────────
    const pipelinesTable = new dynamodb.Table(this, 'PipelinesTable', {
      tableName: 'nexflow-pipelines',
      partitionKey: { name: 'pipelineId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // GSI para buscar por status
    pipelinesTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // ─────────────────────────────────────────
    // Lambda — procesador de eventos
    // ─────────────────────────────────────────
    const eventProcessor = new lambda.Function(this, 'PipelineEventProcessor', {
      functionName: 'nexflow-event-processor',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'pipeline-event-processor.handler',
      code: lambda.Code.fromAsset('../lambda/functions'),
      environment: {
        PIPELINE_TABLE: pipelinesTable.tableName,
        NOTIFICATIONS_TOPIC_ARN: notificationsTopic.topicArn,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1' // reutilizar conexiones HTTP
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      reservedConcurrentExecutions: 10 // límite de concurrencia
    });

    // Trigger: SQS → Lambda (batch de hasta 10 mensajes)
    eventProcessor.addEventSource(new sqs_event_source.SqsEventSource(pipelineEventsQueue, {
      batchSize: 10,
      reportBatchItemFailures: true // partial batch response
    }));

    // Permisos mínimos (principio de menor privilegio)
    pipelinesTable.grantWriteData(eventProcessor);
    notificationsTopic.grantPublish(eventProcessor);

    // ─────────────────────────────────────────
    // RDS PostgreSQL — base de datos principal
    // ─────────────────────────────────────────
    const dbSecret = new rds.DatabaseSecret(this, 'NexflowDbSecret', {
      username: 'nexflow',
    });

    new rds.DatabaseInstance(this, 'NexflowPostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'nexflow',
      multiAz: false,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // ─────────────────────────────────────────
    // Outputs — valores exportados del stack
    // ─────────────────────────────────────────
    new cdk.CfnOutput(this, 'DataBucketName', { value: dataBucket.bucketName });
    new cdk.CfnOutput(this, 'PipelineQueueUrl', { value: pipelineEventsQueue.queueUrl });
    new cdk.CfnOutput(this, 'NotificationsTopicArn', { value: notificationsTopic.topicArn });
  }
}
