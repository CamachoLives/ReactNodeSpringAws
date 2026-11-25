package com.nexflow.application.strategy;

import com.nexflow.domain.entity.DataRecord;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estrategia concreta: enriquece registros con metadatos adicionales
 */
@Component
public class EnrichmentProcessor implements DataProcessor {

    @Override
    public List<DataRecord> process(List<DataRecord> records) {
        return records.stream()
                .filter(r -> Boolean.TRUE.equals(r.getValid()))
                .peek(this::enrich)
                .toList();
    }

    private void enrich(DataRecord record) {
        // Agrega timestamp de enriquecimiento al payload como JSON simple
        String enriched = record.getPayload()
                .replace("}", ", \"enrichedAt\": \"" + LocalDateTime.now() + "\"}");
        record.setPayload(enriched);
    }

    @Override
    public String getProcessorType() { return "ENRICHMENT"; }
}
