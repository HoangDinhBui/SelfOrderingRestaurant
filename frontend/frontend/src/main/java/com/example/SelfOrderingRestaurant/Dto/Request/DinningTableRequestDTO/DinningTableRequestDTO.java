package com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@NoArgsConstructor
public class DinningTableRequestDTO {
    private TableStatus tableStatus;
}