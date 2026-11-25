package com.nexflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio - no depende de frameworks (Clean Architecture)
 * SRP: solo representa el estado del Pipeline
 */
@Entity
@Table(name = "pipelines")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pipeline {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    private PipelineStatus status;

    @Column(name = "source_type")
    @Enumerated(EnumType.STRING)
    private SourceType sourceType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "records_processed")
    private Long recordsProcessed;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = PipelineStatus.IDLE;
        if (recordsProcessed == null) recordsProcessed = 0L;
    }

    // Comportamiento de dominio — lógica de negocio dentro de la entidad
    public void start() {
        if (status == PipelineStatus.RUNNING) {
            throw new IllegalStateException("Pipeline ya está en ejecución: " + name);
        }
        this.status = PipelineStatus.RUNNING;
        this.lastRunAt = LocalDateTime.now();
    }

    public void complete(long processedRecords) {
        this.status = PipelineStatus.COMPLETED;
        this.recordsProcessed += processedRecords;
    }

    public void fail() {
        this.status = PipelineStatus.FAILED;
    }

    public boolean isActive() {
        return status == PipelineStatus.RUNNING;
    }
}
