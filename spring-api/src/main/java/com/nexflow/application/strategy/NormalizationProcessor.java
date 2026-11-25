package com.nexflow.application.strategy;

import com.nexflow.domain.entity.DataRecord;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Estrategia concreta: normaliza registros (trim, lowercase keys, etc.)
 */
@Component
public class NormalizationProcessor implements DataProcessor {

    @Override
    public List<DataRecord> process(List<DataRecord> records) {
        // Programación funcional: transformación pura sin efectos secundarios externos
        return records.stream()
                .filter(r -> Boolean.TRUE.equals(r.getValid())) // solo válidos
                .map(this::normalize)
                .toList();
    }

    private DataRecord normalize(DataRecord record) {
        String normalized = record.getPayload()
                .trim()
                .replaceAll("\\s+", " ");
        record.setPayload(normalized);
        return record;
    }

    @Override
    public String getProcessorType() { return "NORMALIZATION"; }
}
