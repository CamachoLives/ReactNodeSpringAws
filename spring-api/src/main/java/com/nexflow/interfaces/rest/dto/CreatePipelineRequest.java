package com.nexflow.interfaces.rest.dto;

import com.nexflow.domain.entity.SourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePipelineRequest(
        @NotBlank String name,
        @NotNull SourceType sourceType
) {}
