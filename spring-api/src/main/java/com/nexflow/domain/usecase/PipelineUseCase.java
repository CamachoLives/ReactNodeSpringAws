package com.nexflow.domain.usecase;

import com.nexflow.domain.entity.Pipeline;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada (Clean Architecture) — define los casos de uso del dominio.
 * OCP: se puede extender con nuevos casos de uso sin modificar los existentes.
 */
public interface PipelineUseCase {
    Pipeline createPipeline(Pipeline pipeline);
    Pipeline startPipeline(UUID id);
    Pipeline stopPipeline(UUID id);
    List<Pipeline> getActivePipelines();
    Pipeline getById(UUID id);
}
