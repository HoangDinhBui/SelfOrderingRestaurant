package com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DinningTableRequestDTO {
    private TableStatus status;
}