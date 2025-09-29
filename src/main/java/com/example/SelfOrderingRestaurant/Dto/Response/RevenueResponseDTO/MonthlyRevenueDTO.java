package com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenueDTO {
    private int year;
    private int month;
    private BigDecimal totalRevenue;
    private BigDecimal totalDiscount;
    private BigDecimal netRevenue;
    private int totalOrders;
    private BigDecimal foodRevenue;
    private BigDecimal drinkRevenue;
    private BigDecimal otherRevenue;
    private List<RevenueDTO> dailyRevenues;
}
