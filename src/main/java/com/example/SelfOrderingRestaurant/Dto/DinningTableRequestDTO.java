package com.example.SelfOrderingRestaurant.Dto;

import com.example.SelfOrderingRestaurant.Entity.Enum.TableStatus;
import lombok.Data;

@Data
public class DinningTableRequestDTO {
    private TableStatus status; // Chỉ cần trường status để cập nhật trạng thái
}