package com.nexflow.infrastructure.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.util.List;

/**
 * ADAPTER PATTERN — adapta el AWS SDK S3Client a nuestra abstracción interna.
 * Hexagonal Architecture: puerto de salida (secondary port).
 * DIP: la capa de aplicación no importa esta clase directamente, usa la interfaz FileStorage.
 */
@Component
public class S3StorageAdapter implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(S3StorageAdapter.class);

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:nexflow-data}")
    private String bucketName;

    public S3StorageAdapter(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String upload(String key, byte[] content, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(content));
        log.info("Subido a S3: s3://{}/{}", bucketName, key);
        return "s3://" + bucketName + "/" + key;
    }

    @Override
    public byte[] download(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        return s3Client.getObjectAsBytes(request).asByteArray();
    }

    @Override
    public List<String> listKeys(String prefix) {
        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(prefix)
                .build();

        return s3Client.listObjectsV2(request)
                .contents()
                .stream()
                .map(S3Object::key)
                .toList();
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(b -> b.bucket(bucketName).key(key));
    }
}
