package com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DinningTableResponseDTO {
    private Integer table_id;
    private Integer capacity;
    private String status;
}