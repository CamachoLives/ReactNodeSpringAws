package com.nexflow.domain.repository;

import com.nexflow.domain.entity.Pipeline;
import com.nexflow.domain.entity.PipelineStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ISP (Interface Segregation Principle):
 * Puerto de dominio — define QUÉ necesita el dominio, no CÓMO se implementa.
 * La infraestructura provee la implementación (DIP).
 */
public interface PipelineRepository {
    Pipeline save(Pipeline pipeline);
    Optional<Pipeline> findById(UUID id);
    Optional<Pipeline> findByName(String name);
    List<Pipeline> findAll();
    List<Pipeline> findByStatus(PipelineStatus status);
    void deleteById(UUID id);
}
