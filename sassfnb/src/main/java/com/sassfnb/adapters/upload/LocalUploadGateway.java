package com.sassfnb.adapters.upload;

import com.sassfnb.application.ports.UploadGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;

@Component("localUploadGateway")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.upload.provider", havingValue = "local") // ✅ chỉ tạo bean khi bật local
public class LocalUploadGateway implements UploadGateway {

    @Value("${app.upload.localDir:uploads}")
    private String localDir;

    @Value("${app.upload.publicBase:http://localhost:8080/files/}")
    private String publicBase;

    /**
     * Upload file (ảnh) bất kỳ xuống local storage
     */
    @Override
    public String upload(String objectKey, byte[] bytes, String contentType) {
        try {
            String key = normalizeObjectKey(objectKey, contentType);

            File target = new File(localDir, key);
            File parent = target.getParentFile();
            if (parent != null)
                parent.mkdirs();

            try (FileOutputStream fos = new FileOutputStream(target)) {
                fos.write(bytes);
            }

            String base = trimTrailingSlash(publicBase);
            return base + "/" + key.replace("\\", "/");
        } catch (Exception e) {
            throw new RuntimeException("Cannot save file: " + objectKey, e);
        }
    }

    // ========== helpers ==========

    private static String normalizeObjectKey(String objectKey, String contentType) {
        String key = (objectKey == null || objectKey.isBlank())
                ? "upload"
                : objectKey.replace("\\", "/");

        String ext = extFromContentType(contentType);
        String lower = key.toLowerCase(Locale.ROOT);

        // nếu đã có ext đúng thì giữ nguyên
        if (lower.endsWith("." + ext))
            return key;

        // nếu không có extension đúng => append ext
        return key + "." + ext;
    }

    private static String extFromContentType(String contentType) {
        if (contentType == null)
            return "bin";
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> "png";
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/webp" -> "webp";
            default -> "bin";
        };
    }

    private static String trimTrailingSlash(String s) {
        if (s == null)
            return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
