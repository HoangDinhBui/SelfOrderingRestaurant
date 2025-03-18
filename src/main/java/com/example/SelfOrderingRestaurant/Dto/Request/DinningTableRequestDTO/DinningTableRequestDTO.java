package com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import lombok.Data;

@Data
public class DinningTableRequestDTO {
    private TableStatus status;
}