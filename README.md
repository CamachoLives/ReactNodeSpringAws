# NexFlow Analytics Platform

Plataforma de análisis de datos en tiempo real construida como proyecto de aprendizaje full-stack.

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Core API | Spring Boot 3 + Java 21 | REST API, dominio, patrones |
| ETL Service | Node.js 20 | Pipelines de datos, funcional |
| Dashboard | React 18 | UI reactiva, hooks, Redux |
| Admin Panel | Angular 17 | Panel admin, RxJS |
| Cloud | AWS (S3, SQS, Lambda, RDS) | Infraestructura |

## Conceptos Cubiertos

### Principios SOLID
- **S** – SRP: cada clase tiene una sola responsabilidad
- **O** – OCP: abierto a extensión, cerrado a modificación (Strategy pattern)
- **L** – LSP: sustitución de Liskov en jerarquías de procesadores
- **I** – ISP: interfaces específicas en repositorios
- **D** – DIP: inyección de dependencias en Spring

### Patrones de Diseño
- **Creacionales**: Factory, Builder, Singleton
- **Estructurales**: Adapter (AWS SDK), Decorator, Composite
- **Comportamiento**: Strategy, Observer, Command, Template Method, Chain of Responsibility

### Arquitecturas
- **Clean Architecture** en Spring Boot (domain → application → infrastructure → interfaces)
- **Hexagonal Architecture** (ports & adapters) en Node.js ETL
- **Feature-based** en React y Angular

### Programación
- **Funcional**: streams Java, map/filter/reduce en Node.js, RxJS en Angular
- **Imperativa**: control de flujo, gestión de estado mutable
- **Reactiva**: eventos, observables, websockets
- **Concurrencia**: CompletableFuture, thread pools, Worker Threads
- **Paralelismo**: parallel streams Java, cluster Node.js

### ETL Pipeline
- **Extract**: múltiples fuentes (REST, DB, S3, CSV)
- **Transform**: normalización, enriquecimiento, validación
- **Load**: batch inserts, streaming a S3, publicación a SQS

## Módulos

```
nexflow/
├── spring-api/      # Core API - Clean Architecture
├── node-etl/        # ETL Service - Hexagonal + Funcional
├── react-dashboard/ # Dashboard - Functional React
├── angular-admin/   # Admin Panel - Reactive Angular
├── aws-infra/       # Infraestructura - CDK + Lambda
└── docs/           # Guía de aprendizaje y arquitectura
```

## Guía de Aprendizaje

Ver [docs/learning-guide/](docs/learning-guide/) para rutas de aprendizaje por concepto.
