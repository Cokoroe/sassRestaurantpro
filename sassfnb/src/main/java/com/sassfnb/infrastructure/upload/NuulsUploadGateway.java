package com.sassfnb.infrastructure.upload;

import com.sassfnb.application.config.NuulsProperties;
import com.sassfnb.application.ports.UploadGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Locale;

@Component("nuulsUploadGateway")
@Primary
@RequiredArgsConstructor
public class NuulsUploadGateway implements UploadGateway {

    private final NuulsProperties props;

    @Override
    public String upload(String objectKey, byte[] bytes, String contentType) {
        if (props.getApiKey() == null || props.getApiKey().isBlank()) {
            throw new IllegalStateException("Nuuls apiKey is missing. Set app.nuuls.apiKey");
        }
        if (props.getApiBase() == null || props.getApiBase().isBlank()) {
            throw new IllegalStateException("Nuuls apiBase is missing. Set app.nuuls.apiBase");
        }

        final String filename = normalizeFilename(objectKey, contentType);

        ByteArrayResource fileResource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        RestClient client = RestClient.builder()
                .baseUrl(trimTrailingSlash(props.getApiBase()))
                .build();

        String res = client.post()
                .uri("/uploads")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .header("X-API-Key", props.getApiKey())
                .body(body)
                .retrieve()
                .body(String.class);

        if (res == null || res.isBlank()) {
            throw new IllegalStateException("Nuuls upload failed: empty response");
        }

        return res.trim();
    }

    private static String normalizeFilename(String objectKey, String contentType) {
        String base = (objectKey == null || objectKey.isBlank()) ? "upload" : objectKey.replace("\\", "/");
        String ext = extFromContentType(contentType);
        String lower = base.toLowerCase(Locale.ROOT);

        // nếu đã có extension đúng thì giữ
        if (lower.endsWith("." + ext))
            return base;

        // nếu base đã có ext khác -> vẫn append theo ext chuẩn (đỡ sai)
        return base + "." + ext;
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
            return null;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
