package com.nexflow.infrastructure.aws;

import com.nexflow.application.service.PipelineEventPublisher;
import com.nexflow.domain.entity.Pipeline;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/**
 * Implementación del puerto PipelineEventPublisher usando AWS SQS.
 * ADAPTER: adapta SQS al contrato definido por la capa de aplicación.
 * DIP: PipelineService no sabe que los eventos van a SQS.
 */
@Component
public class SqsMessagePublisher implements PipelineEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SqsMessagePublisher.class);

    private final SqsClient sqsClient;

    @Value("${aws.sqs.pipeline-events-url:https://sqs.us-east-1.amazonaws.com/000000000/nexflow-events}")
    private String queueUrl;

    public SqsMessagePublisher(SqsClient sqsClient) {
        this.sqsClient = sqsClient;
    }

    @Override
    public void publishCreated(Pipeline pipeline) {
        publish("PIPELINE_CREATED", pipeline);
    }

    @Override
    public void publishStarted(Pipeline pipeline) {
        publish("PIPELINE_STARTED", pipeline);
    }

    @Override
    public void publishStopped(Pipeline pipeline) {
        publish("PIPELINE_STOPPED", pipeline);
    }

    @Override
    public void publishCompleted(Pipeline pipeline) {
        publish("PIPELINE_COMPLETED", pipeline);
    }

    private void publish(String eventType, Pipeline pipeline) {
        String messageBody = """
                {"eventType":"%s","pipelineId":"%s","pipelineName":"%s","status":"%s"}
                """.formatted(eventType, pipeline.getId(), pipeline.getName(), pipeline.getStatus());

        SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(messageBody)
                .messageGroupId(pipeline.getId().toString()) // FIFO ordering por pipeline
                .build();

        sqsClient.sendMessage(request);
        log.info("Evento publicado en SQS: {} para pipeline: {}", eventType, pipeline.getName());
    }
}
