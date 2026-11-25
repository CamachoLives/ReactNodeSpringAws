# Ruta de Aprendizaje — NexFlow Analytics Platform

## Orden recomendado de estudio

### Semana 1 — Fundamentos de Arquitectura

| Día | Tema | Archivo |
|-----|------|---------|
| 1 | Clean Architecture en Spring Boot | `spring-api/domain/` |
| 2 | SOLID: SRP, OCP | `PipelineService.java`, `DataProcessor.java` |
| 3 | SOLID: LSP, ISP, DIP | Interfaces en `domain/repository/` |
| 4 | Hexagonal Architecture (Node.js) | `node-etl/src/extract/DataExtractor.js` |
| 5 | Revisión + ejercicio: agregar nuevo SourceType | Ambos módulos |

### Semana 2 — Patrones de Diseño

| Día | Tema | Archivo |
|-----|------|---------|
| 1 | Factory Pattern | `ProcessorFactory.java`, `ExtractorRegistry.js` |
| 2 | Strategy Pattern | `DataProcessor.java` y sus implementaciones |
| 3 | Observer Pattern | `PipelineEvent.java`, `PipelineEventListener.java` |
| 4 | Template Method + Chain of Responsibility | `BatchLoader.js`, `LoaderChain.js` |
| 5 | Composite + Command | `EtlPipeline.js`, Lambda handlers |

### Semana 3 — Concurrencia y Paralelismo

| Día | Tema | Archivo |
|-----|------|---------|
| 1 | CompletableFuture en Java | `AsyncPipelineExecutor.java` |
| 2 | Thread Pools + Virtual Threads (Java 21) | `ConcurrencyConfig.java` |
| 3 | Parallel Streams en Java | Método `saveInParallel()` |
| 4 | Worker Threads en Node.js | `WorkerPool.js` |
| 5 | Promise.all / concurrencia limitada | `parallelWithConcurrencyLimit()` |

### Semana 4 — Programación Funcional

| Día | Tema | Archivo |
|-----|------|---------|
| 1 | Streams + Lambdas en Java | `ValidationProcessor.java`, `NormalizationProcessor.java` |
| 2 | pipe(), compose(), curry() en JS | `transformers.js` |
| 3 | Funciones puras e inmutabilidad | `TransformPipeline.js` |
| 4 | Higher-order functions | `pipelineSelectors.js`, `pipelineSlice.js` |
| 5 | RxJS Observables en Angular | `pipeline.service.ts` |

### Semana 5 — AWS y Cloud

| Día | Tema | Archivo |
|-----|------|---------|
| 1 | S3 con AWS SDK v2 | `S3StorageAdapter.java`, `S3Extractor.js` |
| 2 | SQS (colas de mensajes) | `SqsMessagePublisher.java` |
| 3 | Lambda serverless | `pipeline-event-processor.js` |
| 4 | DynamoDB + SNS | Lambda handlers |
| 5 | CDK Infrastructure as Code | `nexflow-stack.ts` |

## Ejercicios propuestos por módulo

### Spring Boot
1. Agregar un nuevo tipo de procesador (ej: `DeduplicationProcessor`)
2. Implementar `PipelineStatisticsService` que use parallel streams
3. Agregar cache con `@Cacheable` al método `getById()`
4. Crear un `CommandProcessor` usando el patrón Command

### Node.js ETL
1. Implementar `KafkaExtractor` y registrarlo en `ExtractorRegistry`
2. Agregar una transformación de enriquecimiento que llame a una API externa
3. Crear un `ElasticsearchLoader` que implemente `BatchLoader`
4. Implementar retry con jitter en `withRetry()`

### React
1. Agregar un componente de gráfica con Recharts usando datos del store
2. Implementar optimistic updates en startPipeline
3. Crear un selector que calcule el pipeline más activo
4. Agregar virtualización de lista para 10,000+ pipelines

### Angular
1. Agregar un guard que verifique permisos antes de iniciar pipeline
2. Implementar un interceptor HTTP para logging de requests
3. Crear un pipe personalizado que formatee el status en español
4. Agregar debounce al buscador usando RxJS

### AWS
1. Agregar una función Lambda que genere reportes diarios desde S3
2. Configurar CloudWatch Alarms para cuando falle un pipeline
3. Implementar DynamoDB Streams para auditoria de cambios
4. Agregar Step Functions para orquestar pipelines multi-step
