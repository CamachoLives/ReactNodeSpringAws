package com.nexflow.interfaces.rest.controller;

import com.nexflow.domain.entity.Pipeline;
import com.nexflow.domain.usecase.PipelineUseCase;
import com.nexflow.interfaces.rest.dto.CreatePipelineRequest;
import com.nexflow.interfaces.rest.dto.PipelineResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * SRP: solo maneja HTTP — traduce request → dominio → response.
 * No contiene lógica de negocio.
 */
@RestController
@RequestMapping("/api/v1/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineUseCase pipelineUseCase;

    @PostMapping
    public ResponseEntity<PipelineResponse> create(
            @Valid @RequestBody CreatePipelineRequest request) {
        Pipeline pipeline = Pipeline.builder()
                .name(request.name())
                .sourceType(request.sourceType())
                .build();
        Pipeline created = pipelineUseCase.createPipeline(pipeline);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(PipelineResponse.from(created));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<PipelineResponse> start(@PathVariable UUID id) {
        return ResponseEntity.ok(PipelineResponse.from(pipelineUseCase.startPipeline(id)));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<PipelineResponse> stop(@PathVariable UUID id) {
        return ResponseEntity.ok(PipelineResponse.from(pipelineUseCase.stopPipeline(id)));
    }

    @GetMapping
    public ResponseEntity<List<PipelineResponse>> listActive() {
        List<PipelineResponse> responses = pipelineUseCase.getActivePipelines()
                .stream()
                .map(PipelineResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipelineResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(PipelineResponse.from(pipelineUseCase.getById(id)));
    }
}
