package com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CompleteTableResponseDTO {
    private Integer id;
    private String tableNumber;
    private Integer capacity;
    private String status;
    private List<DishDTO> dishes;
    private Integer notificationCount;
}
