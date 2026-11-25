package com.nexflow.application.strategy;

import com.nexflow.domain.entity.DataRecord;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Estrategia concreta: valida registros
 * LSP: puede usarse en cualquier lugar donde se espera DataProcessor
 */
@Component
public class ValidationProcessor implements DataProcessor {

    @Override
    public List<DataRecord> process(List<DataRecord> records) {
        return records.stream()
                .peek(this::validate)
                .toList(); // programación funcional: stream pipeline
    }

    private void validate(DataRecord record) {
        if (record.getPayload() == null || record.getPayload().isBlank()) {
            record.setValid(false);
            record.setErrorMessage("Payload vacío");
        } else if (record.getPayload().length() > 10_000) {
            record.setValid(false);
            record.setErrorMessage("Payload excede límite de 10KB");
        } else {
            record.setValid(true);
        }
    }

    @Override
    public String getProcessorType() { return "VALIDATION"; }
}
