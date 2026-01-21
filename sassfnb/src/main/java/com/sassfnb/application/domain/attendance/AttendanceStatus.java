package com.sassfnb.application.domain.attendance;

public enum AttendanceStatus {

    /**
     * Đi làm bình thường (clock-in hợp lệ)
     */
    PRESENT,

    /**
     * Không đi làm (auto tạo khi chốt ca)
     */
    ABSENT,

    /**
     * Đi trễ (có thể xử lý sau)
     */
    LATE,

    /**
     * Staff đã gửi yêu cầu chỉnh công
     */
    ADJUSTMENT_PENDING,

    /**
     * Quản lý đã duyệt chỉnh công
     */
    ADJUSTED,

    /**
     * Quản lý từ chối chỉnh công
     */
    REJECTED
}
