package com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class YearlyRevenueDTO {
    private int year;
    private BigDecimal totalRevenue;
    private BigDecimal totalDiscount;
    private BigDecimal netRevenue;
    private int totalOrders;
    private Map<String, BigDecimal> monthlyRevenues; // Map of month name to revenue
    private BigDecimal foodRevenue;
    private BigDecimal drinkRevenue;
    private BigDecimal otherRevenue;
}
