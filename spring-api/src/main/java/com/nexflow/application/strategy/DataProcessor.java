package com.nexflow.application.strategy;

import com.nexflow.domain.entity.DataRecord;
import java.util.List;

/**
 * STRATEGY PATTERN
 * Abstracción del algoritmo de procesamiento.
 * OCP: agregar un nuevo tipo de procesador no modifica el cliente.
 * LSP: cualquier implementación puede sustituir a DataProcessor sin romper el contrato.
 */
public interface DataProcessor {
    List<DataRecord> process(List<DataRecord> records);
    String getProcessorType();
}
