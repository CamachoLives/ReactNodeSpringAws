package com.nexflow.interfaces.rest.dto;

import com.nexflow.domain.entity.Pipeline;
import com.nexflow.domain.entity.PipelineStatus;
import com.nexflow.domain.entity.SourceType;
import java.time.LocalDateTime;
import java.util.UUID;

public record PipelineResponse(
        UUID id,
        String name,
        PipelineStatus status,
        SourceType sourceType,
        LocalDateTime createdAt,
        LocalDateTime lastRunAt,
        Long recordsProcessed
) {
    public static PipelineResponse from(Pipeline p) {
        return new PipelineResponse(
                p.getId(), p.getName(), p.getStatus(), p.getSourceType(),
                p.getCreatedAt(), p.getLastRunAt(), p.getRecordsProcessed()
        );
    }
}
