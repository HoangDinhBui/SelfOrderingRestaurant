package com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class ReservationRequestDTO {
    @NotBlank(message = "Vui lòng nhập tên khách")
    private String customerName;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    private String contactPhone;

    @NotNull(message = "Vui lòng nhập số khách")
    @Min(value = 1, message = "Số khách phải từ 1 trở lên")
    private Integer guestCount;

    @NotNull(message = "Vui lòng chọn bàn")
    private Integer tableId;

    // Giờ Việt Nam, dạng yyyy-MM-ddTHH:mm:ss
    @NotNull(message = "Vui lòng chọn thời gian đặt bàn")
    private LocalDateTime reservationTime;

    private String notes;

    // Món đặt trước, có thể bỏ trống
    private List<OrderItemDTO> items;
}
