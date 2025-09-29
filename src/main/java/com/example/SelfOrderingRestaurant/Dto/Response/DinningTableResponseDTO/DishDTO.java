package com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DishDTO {
    private Integer id;
    private String name;
    private Integer quantity;
    private Integer price;
    private String status;
    private String image;
    private Integer orderId;
}
