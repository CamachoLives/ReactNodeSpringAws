package com.nexflow.application.concurrency;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Configuración del pool de hilos.
 * Virtual Threads (Java 21): hilos ligeros del Project Loom para I/O intensivo.
 * ThreadPoolTaskExecutor: pool clásico configurable para CPU-bound.
 */
@Configuration
@EnableAsync
public class ConcurrencyConfig {

    /**
     * Pool de hilos para operaciones de pipeline (CPU-bound)
     * corePoolSize  = núcleos disponibles
     * maxPoolSize   = coreSize * 2 para picos
     * queueCapacity = cola de tareas pendientes
     */
    @Bean(name = "pipelineThreadPool")
    public ThreadPoolTaskExecutor pipelineTaskExecutor() {
        int cores = Runtime.getRuntime().availableProcessors();
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(cores);
        executor.setMaxPoolSize(cores * 2);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("nexflow-pipeline-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * Virtual Threads (Java 21 / Project Loom) para I/O intensivo (AWS SDK, DB).
     * Millones de hilos virtuales con overhead mínimo comparado con hilos del OS.
     */
    @Bean(name = "virtualThreadPool")
    public ExecutorService virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    /**
     * Pool dedicado para operaciones de escritura batch en DB
     */
    @Bean(name = "dbWritePool")
    public ExecutorService dbWriteExecutor() {
        int cores = Runtime.getRuntime().availableProcessors();
        return Executors.newFixedThreadPool(cores, r -> {
            Thread t = new Thread(r);
            t.setName("nexflow-db-write-" + t.getId());
            t.setDaemon(true);
            return t;
        });
    }
}
