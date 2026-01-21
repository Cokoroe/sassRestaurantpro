// src/main/java/com/sassfnb/application/ports/AuditLogPort.java
package com.sassfnb.application.ports;

public interface AuditLogPort {
    void log(String action, String entity, String entityId, String detailsJson);
}
