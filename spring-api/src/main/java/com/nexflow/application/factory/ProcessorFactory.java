package com.nexflow.application.factory;

import com.nexflow.application.strategy.DataProcessor;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * FACTORY PATTERN
 * Crea procesadores según el tipo solicitado.
 * DIP: recibe todos los DataProcessor (inyectados por Spring) y los indexa por tipo.
 * OCP: registrar un nuevo procesador no requiere modificar esta clase.
 */
@Component
public class ProcessorFactory {

    private final Map<String, DataProcessor> processorRegistry;

    public ProcessorFactory(List<DataProcessor> processors) {
        this.processorRegistry = processors.stream()
                .collect(Collectors.toMap(
                        DataProcessor::getProcessorType,
                        Function.identity()
                ));
    }

    public DataProcessor getProcessor(String type) {
        DataProcessor processor = processorRegistry.get(type.toUpperCase());
        if (processor == null) {
            throw new IllegalArgumentException("Procesador no encontrado: " + type);
        }
        return processor;
    }

    public List<String> getAvailableTypes() {
        return List.copyOf(processorRegistry.keySet());
    }
}
