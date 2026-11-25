package com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thông tin bàn cho khách chọn khi đặt trước: không lộ trạng thái hay QR. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicTableDTO {
    private Integer tableNumber;
    private Integer capacity;
}
