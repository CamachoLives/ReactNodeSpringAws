package com.nexflow.application.concurrency;

import com.nexflow.application.factory.ProcessorFactory;
import com.nexflow.domain.entity.DataRecord;
import com.nexflow.domain.entity.Pipeline;
import com.nexflow.domain.repository.DataRecordRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

/**
 * CONCURRENCIA Y PARALELISMO en Java
 *
 * CompletableFuture — programación asíncrona no bloqueante
 * ExecutorService  — pool de hilos controlado
 * Parallel Streams — paralelismo automático en colecciones
 *
 * Patrón: Pipeline asíncrono (validate → normalize → enrich → save)
 */
@Component
@RequiredArgsConstructor
public class AsyncPipelineExecutor {

    private static final Logger log = LoggerFactory.getLogger(AsyncPipelineExecutor.class);

    private final ProcessorFactory processorFactory;
    private final DataRecordRepository dataRecordRepository;
    private final ExecutorService pipelineThreadPool;

    /**
     * Ejecuta el pipeline completo de forma asíncrona.
     * Retorna CompletableFuture para no bloquear el hilo del llamador.
     */
    @Async("pipelineThreadPool")
    public CompletableFuture<Long> executeAsync(Pipeline pipeline, List<DataRecord> records) {
        log.info("Iniciando pipeline async: {} con {} registros en hilo: {}",
                pipeline.getName(), records.size(), Thread.currentThread().getName());

        return CompletableFuture
                .supplyAsync(() -> validate(records), pipelineThreadPool)
                .thenApplyAsync(this::normalize, pipelineThreadPool)
                .thenApplyAsync(this::enrich, pipelineThreadPool)
                .thenApplyAsync(this::saveInParallel, pipelineThreadPool)
                .exceptionally(ex -> {
                    log.error("Pipeline fallido: {}", ex.getMessage());
                    return 0L;
                });
    }

    /**
     * Ejecuta múltiples pipelines en PARALELO — paralelismo real con fork/join
     */
    public List<CompletableFuture<Long>> executeParallel(
            List<Pipeline> pipelines, List<List<DataRecord>> recordBatches) {

        // zip pipelines con sus batches y lanzar en paralelo
        List<CompletableFuture<Long>> futures = new java.util.ArrayList<>();
        for (int i = 0; i < pipelines.size(); i++) {
            final Pipeline p = pipelines.get(i);
            final List<DataRecord> batch = recordBatches.get(i);
            futures.add(executeAsync(p, batch));
        }
        return futures;
    }

    /**
     * Espera todos los futuros y agrega resultados (programación funcional + concurrencia)
     */
    public long awaitAll(List<CompletableFuture<Long>> futures) {
        return futures.stream()
                .mapToLong(CompletableFuture::join) // bloquea hasta completar cada uno
                .sum();
    }

    private List<DataRecord> validate(List<DataRecord> records) {
        return processorFactory.getProcessor("VALIDATION").process(records);
    }

    private List<DataRecord> normalize(List<DataRecord> records) {
        return processorFactory.getProcessor("NORMALIZATION").process(records);
    }

    private List<DataRecord> enrich(List<DataRecord> records) {
        return processorFactory.getProcessor("ENRICHMENT").process(records);
    }

    /**
     * PARALLEL STREAMS — procesa en múltiples hilos automáticamente (ForkJoinPool)
     */
    private long saveInParallel(List<DataRecord> records) {
        // parallelStream() usa el ForkJoinPool.commonPool()
        List<DataRecord> saved = records.parallelStream()
                .map(dataRecordRepository::save)
                .toList();

        log.info("Guardados {} registros en paralelo", saved.size());
        return saved.size();
    }
}
