package com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CreateFeedbackRequest {
    // Optional: guests have no customer account, the order's customer is used instead
    private Integer customerId;
    private Integer orderId;

    @NotNull(message = "Vui lòng chọn số sao")
    @Min(value = 1, message = "Số sao từ 1 đến 5")
    @Max(value = 5, message = "Số sao từ 1 đến 5")
    private Integer rating;

    @Size(max = 1000, message = "Nhận xét tối đa 1000 ký tự")
    private String feedback;

    @Size(max = 20, message = "Tối đa 20 thẻ")
    private List<String> selectedTags;
}
