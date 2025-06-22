package com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class TableTransferNotificationDTO {
    private String type;
    private Integer sourceTableId;
    private Integer destinationTableId;

    public TableTransferNotificationDTO(Integer sourceTableId, Integer destinationTableId) {
        this.type = "TABLE_TRANSFERRED";
        this.sourceTableId = sourceTableId;
        this.destinationTableId = destinationTableId;
    }
}