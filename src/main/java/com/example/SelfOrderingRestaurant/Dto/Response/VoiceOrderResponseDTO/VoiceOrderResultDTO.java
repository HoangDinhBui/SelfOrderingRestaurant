package com.example.SelfOrderingRestaurant.Dto.Response.VoiceOrderResponseDTO;

import java.math.BigDecimal;
import java.util.List;

/**
 * Kết quả tách món từ câu nói của khách. Chỉ là đề xuất: khách xác nhận trên màn hình
 * rồi frontend mới thêm vào giỏ.
 */
public record VoiceOrderResultDTO(String transcript, List<Item> items, List<String> unmatched) {

    public record Item(Integer dishId, String dishName, BigDecimal price, String image,
                       int quantity, String notes) {
    }
}
