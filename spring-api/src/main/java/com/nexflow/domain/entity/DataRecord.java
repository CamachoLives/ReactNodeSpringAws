package com.nexflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "data_records")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pipeline_id")
    private UUID pipelineId;

    @Column(nullable = false)
    private String payload;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "is_valid")
    private Boolean valid;

    @Column(name = "error_message")
    private String errorMessage;

    @PrePersist
    protected void onCreate() {
        processedAt = LocalDateTime.now();
    }
}
