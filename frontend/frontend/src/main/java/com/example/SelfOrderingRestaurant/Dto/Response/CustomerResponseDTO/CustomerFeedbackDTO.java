package com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO;
import lombok.Data;

@Data
public class CustomerFeedbackDTO {
    private Integer id;
    private String customerName;
    private Integer orderId;
    private Integer rating;
    private String comment;
    private String time;
    private String date;
    private Boolean checked;
}
