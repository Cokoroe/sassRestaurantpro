package com.sassfnb.application.ports;

public interface UploadGateway {

    /**
     * Upload một file bất kỳ (ảnh) lên storage và trả public URL.
     *
     * @param objectKey   đường dẫn tương đối (vd "menu/items/{id}/cover.jpg")
     * @param bytes       nội dung file
     * @param contentType MIME type (vd "image/jpeg")
     * @return public URL
     */
    String upload(String objectKey, byte[] bytes, String contentType);

    /**
     * Helper giữ lại cho QR (đỡ phải sửa các nơi đang dùng).
     */
    default String uploadPng(String objectKey, byte[] png) {
        return upload(objectKey, png, "image/png");
    }
}
