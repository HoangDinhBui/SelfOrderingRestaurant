package com.example.SelfOrderingRestaurant.Dto.Request.CategoryDTO;

import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Enum.CategoryStatus;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CategoryDTO {
    private String name;
    private String description;
    private String image;
    private CategoryStatus status;
}
