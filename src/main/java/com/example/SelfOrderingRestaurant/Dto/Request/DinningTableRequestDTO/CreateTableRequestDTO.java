package com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTableRequestDTO {
    @NotNull(message = "Table number is required")
    @Min(value = 1, message = "Table number must be positive")
    private Integer tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Table status is required")
    private TableStatus tableStatus;

    private String location;
    private String qrCode;
}
