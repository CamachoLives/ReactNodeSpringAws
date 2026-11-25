# Clean Architecture en NexFlow

## Capas (de interior a exterior)

```
┌─────────────────────────────────────────────┐
│              INTERFACES (REST)               │  ← HTTP Controllers, DTOs
├─────────────────────────────────────────────┤
│           INFRASTRUCTURE (AWS, DB)           │  ← Adaptadores, configuración
├─────────────────────────────────────────────┤
│         APPLICATION (Services, Factories)    │  ← Casos de uso, orquestación
├─────────────────────────────────────────────┤
│          DOMAIN (Entities, Repositories)     │  ← Reglas de negocio puras
└─────────────────────────────────────────────┘
```

## Regla de dependencia
> Las dependencias siempre apuntan hacia adentro. El dominio no importa nada del exterior.

```
interfaces → application → domain ← infrastructure
                 ↑                        ↑
                DIP (interfaces)      DIP (implementa interfaces del dominio)
```

## Hexagonal Architecture en Node.js ETL

```
           ┌─────────────────────────────┐
  REST ────►│         PRIMARY ADAPTERS    │
  SQS  ────►│   (Extractors, Triggers)   │
  CSV  ────►│                            │
           ├─────────────────────────────┤
           │       APPLICATION CORE      │
           │   EtlPipeline, Transformers │
           ├─────────────────────────────┤
  S3  ◄────│       SECONDARY ADAPTERS   │
  DB  ◄────│    (Loaders, Publishers)   │
  SQS ◄────│                            │
           └─────────────────────────────┘
```

## ¿Por qué Clean Architecture?

| Beneficio | Cómo se ve en NexFlow |
|-----------|----------------------|
| Testabilidad | `PipelineService` se prueba sin DB ni AWS |
| Independencia de frameworks | La entidad `Pipeline` no importa Spring |
| Flexibilidad | Cambiar PostgreSQL → MongoDB: solo cambiar `JpaPipelineRepository` |
| Legibilidad | Cada capa tiene una sola razón para cambiar |
