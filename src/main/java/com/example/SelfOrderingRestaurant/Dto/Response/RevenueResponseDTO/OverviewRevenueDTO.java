package com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OverviewRevenueDTO {
    private BigDecimal totalRevenue;
    private int totalOrders;
    private int totalCustomers;
    private Map<String, BigDecimal> revenueByCategory; // Pie chart data
    private Map<String, BigDecimal> monthlyRevenue; // Last 12 months
    private Map<String, BigDecimal> dailyRevenue; // Last 30 days
    private BigDecimal averageOrderValue;
}
