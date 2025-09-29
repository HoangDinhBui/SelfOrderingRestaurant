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
}