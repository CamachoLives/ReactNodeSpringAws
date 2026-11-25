package com.nexflow.application.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * OBSERVER: escucha eventos de Pipeline de forma desacoplada.
 * @Async: el handler corre en un hilo distinto (no bloquea el publicador).
 */
@Component
public class PipelineEventListener {

    private static final Logger log = LoggerFactory.getLogger(PipelineEventListener.class);

    @Async
    @EventListener
    public void handlePipelineEvent(PipelineEvent event) {
        switch (event.getEventType()) {
            case STARTED -> log.info("[PIPELINE] Iniciado: {}", event.getPipeline().getName());
            case COMPLETED -> log.info("[PIPELINE] Completado: {} — {} registros",
                    event.getPipeline().getName(), event.getPipeline().getRecordsProcessed());
            case FAILED -> log.error("[PIPELINE] Falló: {}", event.getPipeline().getName());
            default -> log.debug("[PIPELINE] Evento: {} para {}",
                    event.getEventType(), event.getPipeline().getName());
        }
    }
}
