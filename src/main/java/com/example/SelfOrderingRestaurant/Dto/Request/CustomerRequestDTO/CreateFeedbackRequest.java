package com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO;
import lombok.Data;
import java.util.List;

@Data
public class CreateFeedbackRequest {
    private Integer customerId;
    private Integer orderId;
    private Integer rating;
    private String feedback;
    private List<String> selectedTags;
}
