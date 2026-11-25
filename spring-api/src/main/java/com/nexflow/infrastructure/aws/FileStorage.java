package com.nexflow.infrastructure.aws;

import java.util.List;

/**
 * Puerto de salida para almacenamiento de archivos.
 * ISP: solo métodos necesarios para NexFlow, no toda la API de S3.
 */
public interface FileStorage {
    String upload(String key, byte[] content, String contentType);
    byte[] download(String key);
    List<String> listKeys(String prefix);
    void delete(String key);
}
