package com.nexflow.application.service;

import com.nexflow.domain.entity.Pipeline;
import com.nexflow.domain.entity.PipelineStatus;
import com.nexflow.domain.repository.PipelineRepository;
import com.nexflow.domain.usecase.PipelineUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * SOLID en acción:
 *
 * SRP - Solo orquesta el caso de uso; no hace validación, no hace HTTP, no hace persistencia.
 * OCP - Para nuevos comportamientos, se agrega lógica al pipeline de procesamiento sin tocar aquí.
 * DIP - Depende de abstracciones (PipelineRepository, PipelineUseCase), no de implementaciones.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PipelineService implements PipelineUseCase {

    private final PipelineRepository pipelineRepository;
    private final PipelineEventPublisher eventPublisher;

    @Override
    public Pipeline createPipeline(Pipeline pipeline) {
        Pipeline saved = pipelineRepository.save(pipeline);
        eventPublisher.publishCreated(saved);
        return saved;
    }

    @Override
    public Pipeline startPipeline(UUID id) {
        Pipeline pipeline = getById(id);
        pipeline.start();
        Pipeline saved = pipelineRepository.save(pipeline);
        eventPublisher.publishStarted(saved);
        return saved;
    }

    @Override
    public Pipeline stopPipeline(UUID id) {
        Pipeline pipeline = getById(id);
        pipeline.fail(); // se detiene como "fallido" para permitir reinicio manual
        Pipeline saved = pipelineRepository.save(pipeline);
        eventPublisher.publishStopped(saved);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Pipeline> getActivePipelines() {
        return pipelineRepository.findByStatus(PipelineStatus.RUNNING);
    }

    @Override
    @Transactional(readOnly = true)
    public Pipeline getById(UUID id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pipeline no encontrado: " + id));
    }
}
