package com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDTO {
    private Integer orderId;
    private String customerName;
    private String contactPhone;
    private Integer guestCount;
    private Integer tableNumber;
    private Integer tableCapacity;
    private LocalDateTime reservationTime;
    private String status;
    private String notes;
    private BigDecimal totalAmount;
    private List<OrderItemDTO> items;
}
