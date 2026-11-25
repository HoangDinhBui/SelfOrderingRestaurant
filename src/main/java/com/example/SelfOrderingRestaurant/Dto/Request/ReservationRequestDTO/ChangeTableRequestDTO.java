package com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangeTableRequestDTO {
    @NotNull(message = "Vui lòng chọn bàn")
    private Integer tableId;
}
