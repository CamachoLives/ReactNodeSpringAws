package com.nexflow.application.observer;

import com.nexflow.domain.entity.Pipeline;
import org.springframework.context.ApplicationEvent;

/**
 * OBSERVER PATTERN — usando Spring ApplicationEvent
 * Desacopla el productor del evento de sus consumidores.
 */
public class PipelineEvent extends ApplicationEvent {

    private final Pipeline pipeline;
    private final EventType eventType;

    public PipelineEvent(Object source, Pipeline pipeline, EventType eventType) {
        super(source);
        this.pipeline = pipeline;
        this.eventType = eventType;
    }

    public Pipeline getPipeline() { return pipeline; }
    public EventType getEventType() { return eventType; }

    public enum EventType {
        CREATED, STARTED, STOPPED, COMPLETED, FAILED
    }
}
