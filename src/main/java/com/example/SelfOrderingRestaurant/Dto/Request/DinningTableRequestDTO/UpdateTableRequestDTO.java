package com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateTableRequestDTO {
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private TableStatus tableStatus;
    private String location;
    private String qrCode;
}
