package com.example.SelfOrderingRestaurant.Dto;

import lombok.Data;

@Data
public class DinningTableResponseDTO {
    private Integer table_id; // Đổi thành table_id để phù hợp với yêu cầu
    private Integer capacity;
    private String status; // Đổi thành String để phù hợp với yêu cầu
}