package com.sassfnb.common.qr;

import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public final class StaticQrKit {
    private StaticQrKit() {
    }

    private static final String SECRET = "change-me-super-secret";
    private static final String HMAC = "HmacSHA256";
    private static final char[] BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();

    public static String makeCode(UUID tableId, int len) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), HMAC));
            byte[] raw = mac.doFinal(tableId.toString().getBytes(StandardCharsets.UTF_8));
            // chuyển sang base62 rút gọn
            long acc = 0;
            int take = Math.min(8, raw.length);
            for (int i = 0; i < take; i++)
                acc = (acc << 8) | (raw[i] & 0xff);
            StringBuilder sb = new StringBuilder();
            while (acc > 0 && sb.length() < len) {
                int idx = (int) (acc % 62);
                sb.append(BASE62[idx]);
                acc /= 62;
            }
            while (sb.length() < len)
                sb.append('0');
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static byte[] pngOf(String text, int size) throws Exception {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix matrix = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, size, size, hints);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }
}
