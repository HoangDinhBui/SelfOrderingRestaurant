package com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DinningTableResponseDTO {
    private Integer table_id;
    private Integer capacity;
    private String status;
    // Giờ "HH:mm" của lịch hẹn đã xác nhận sắp tới trong hôm nay, null nếu không có
    private String nextReservationTime;

    public DinningTableResponseDTO(Integer table_id, Integer capacity, String status) {
        this(table_id, capacity, status, null);
    }
}