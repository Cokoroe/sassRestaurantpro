package com.sassfnb.adapters.rest.dto.staff;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class StaffDtos {

        @Getter
        @Setter
        public static class StaffCreateRequest {
                // FE sẽ truyền theo context đang chọn (restaurant/outlet)
                private UUID restaurantId;
                private UUID outletId;

                // auto create user if email not exist
                private String email;

                // BE nên nhận để tạo/cập nhật user
                private String fullName;
                private String phone;

                // optional info
                private String code;
                private String position;
                private String avatarUrl;

                private LocalDate hiredDate; // nếu null -> today

                // ✅ NEW: bắt buộc chọn role khi tạo staff
                private UUID roleId;
        }

        @Getter
        @Setter
        public static class StaffUpdateRequest {
                private UUID restaurantId;
                private UUID outletId;

                private String code;
                private String position;
                private String avatarUrl;

                private LocalDate hiredDate;
                private LocalDate terminatedDate;

                // optional: nếu muốn cập nhật thông tin user từ màn sửa staff
                private String fullName;
                private String phone;
        }

        @Getter
        @Setter
        public static class StaffStatusUpdateRequest {
                private String status; // ACTIVE / INACTIVE
                private String note; // optional (audit sau)
        }

        @Getter
        @Setter
        public static class StaffListParams {
                private UUID restaurantId;
                private UUID outletId;
                private String q;
                private String status; // ACTIVE / INACTIVE
                private Integer page = 0;
                private Integer size = 20;
        }

        @Getter
        @Setter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class StaffResponse {
                private UUID id;

                private UUID tenantId;
                private UUID userId;
                private UUID restaurantId;
                private UUID outletId;

                private String code;
                private String position;
                private String avatarUrl;
                private String status;

                // from user
                private String email;
                private String fullName;
                private String phone;

                private LocalDate hiredDate;
                private LocalDate terminatedDate;

                private Instant createdAt;
                private Instant updatedAt;
        }

        // dùng cho dropdown chọn nhân viên trong schedule
        @Getter
        @Setter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class StaffOptionResponse {
                private UUID id;
                private String label; // ví dụ: "NV001 - Nguyen Van A"
                private String status; // ACTIVE/INACTIVE
                private String position;
                private String avatarUrl;
        }
}
