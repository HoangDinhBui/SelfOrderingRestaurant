package com.example.SelfOrderingRestaurant.Dto;

import lombok.Data;

@Data
public class DinningTableResponseDTO {
    private Integer table_id;
    private Integer capacity;
    private String status;
}