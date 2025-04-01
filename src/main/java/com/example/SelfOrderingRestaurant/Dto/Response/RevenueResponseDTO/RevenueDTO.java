package com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDTO {
    private Long revenueId;
    private LocalDate date;
    private BigDecimal totalRevenue;
    private Integer totalOrders;
    private Integer totalCustomers;
    private BigDecimal foodRevenue;
    private BigDecimal drinkRevenue;
    private BigDecimal otherRevenue;
    private BigDecimal totalDiscount;
    private BigDecimal netRevenue;
    private BigDecimal averageOrderValue;
    private String notes;
}
