package com.nexflow.application.service;

import com.nexflow.domain.entity.Pipeline;

/**
 * ISP: interfaz específica para publicar eventos de Pipeline.
 * No mezcla responsabilidades con otros tipos de eventos.
 */
public interface PipelineEventPublisher {
    void publishCreated(Pipeline pipeline);
    void publishStarted(Pipeline pipeline);
    void publishStopped(Pipeline pipeline);
    void publishCompleted(Pipeline pipeline);
}
