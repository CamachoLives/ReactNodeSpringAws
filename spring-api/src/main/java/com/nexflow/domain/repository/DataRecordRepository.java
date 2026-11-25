package com.nexflow.domain.repository;

import com.nexflow.domain.entity.DataRecord;
import java.util.List;
import java.util.UUID;

/**
 * ISP: interfaz específica para DataRecord — no hereda métodos innecesarios
 */
public interface DataRecordRepository {
    DataRecord save(DataRecord record);
    List<DataRecord> saveAll(List<DataRecord> records);
    List<DataRecord> findByPipelineId(UUID pipelineId);
    long countByPipelineId(UUID pipelineId);
    List<DataRecord> findInvalidRecords(UUID pipelineId);
}
