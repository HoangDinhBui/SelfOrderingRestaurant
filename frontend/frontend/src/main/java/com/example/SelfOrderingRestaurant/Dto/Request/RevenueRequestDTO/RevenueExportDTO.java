package com.example.SelfOrderingRestaurant.Dto.Request.RevenueRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueExportDTO {
    private String reportType; // "daily", "monthly", "yearly"
    private LocalDate startDate;
    private LocalDate endDate;
    private String exportFormat; // "pdf", "excel"
    private List<Long> revenueIds; // Optional: export specific records
}