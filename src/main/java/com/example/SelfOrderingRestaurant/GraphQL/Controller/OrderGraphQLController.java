package com.example.SelfOrderingRestaurant.GraphQL.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.GraphQL.Input.UpdateItemNotesInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.UpdateOrderStatusInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.OrderItemInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.OrderInput;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.UpdateOrderStatusRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentNotificationStatusDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class OrderGraphQLController {
    private static final Logger log = LoggerFactory.getLogger(OrderGraphQLController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    // Query Resolvers
    @QueryMapping
    public List<GetAllOrdersResponseDTO> orders() {
        return orderService.getAllOrders();
    }

    @QueryMapping
    public OrderResponseDTO order(@Argument String orderId) {
        return orderService.getOrderById(Integer.valueOf(orderId));
    }

    @QueryMapping
    public OrderCartResponseDTO orderCart() {
        return orderService.getCurrentOrderCart();
    }

    @QueryMapping
    public OrderPaymentDetailsDTO orderPaymentDetails(@Argument String orderId) {
        try {
            return paymentService.getOrderPaymentDetails(Integer.valueOf(orderId));
        } catch (Exception e) {
            log.error("Error fetching payment details for order {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Failed to retrieve payment details: " + e.getMessage());
        }
    }

    @QueryMapping
    public PaymentNotificationStatusDTO paymentNotificationStatus(@Argument String orderId) {
        try {
            return paymentService.checkPaymentNotificationStatus(Integer.valueOf(orderId));
        } catch (Exception e) {
            log.error("Error checking payment notification status for order {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Failed to check payment notification status: " + e.getMessage());
        }
    }

    // Mutation Resolvers
    @MutationMapping
    public Integer createOrder(@Argument OrderInput input) {
        OrderRequestDTO orderDTO = convertOrderInputToDTO(input);
        return orderService.createOrder(orderDTO);
    }

    @MutationMapping
    public String updateOrderStatus(@Argument String orderId, @Argument UpdateOrderStatusInput input) {
        UpdateOrderStatusRequestDTO requestDTO = new UpdateOrderStatusRequestDTO();
        requestDTO.setStatus(input.getStatus());
        orderService.updateOrderStatus(Integer.valueOf(orderId), requestDTO.getStatus());
        return "Order updated successfully!";
    }

    @MutationMapping
    public OrderCartResponseDTO addDishToOrderCart(@Argument OrderItemInput input) {
        OrderItemDTO itemDTO = new OrderItemDTO();
        itemDTO.setDishId(Integer.valueOf(input.getDishId()));
        itemDTO.setQuantity(input.getQuantity());
        itemDTO.setNotes(input.getNotes());

        return orderService.addDishToOrderCart(itemDTO);
    }

    @MutationMapping
    public OrderCartResponseDTO removeItemFromCart(@Argument String dishId) {
        return orderService.removeItemFromCart(Integer.valueOf(dishId));
    }

    @MutationMapping
    public OrderCartResponseDTO updateItemQuantity(@Argument String dishId, @Argument int quantity) {
        return orderService.updateItemQuantity(Integer.valueOf(dishId), quantity);
    }

    @MutationMapping
    public OrderCartResponseDTO updateItemNotes(@Argument String dishId, @Argument UpdateItemNotesInput input) {
        try {
            return orderService.updateItemNotes(Integer.valueOf(dishId), input.getNotes());
        } catch (Exception e) {
            log.error("Error updating item notes: {}", e.getMessage());
            throw new RuntimeException("Failed to update notes: " + e.getMessage());
        }
    }

    // Helper methods
    private OrderRequestDTO convertOrderInputToDTO(OrderInput input) {
        OrderRequestDTO orderDTO = new OrderRequestDTO();
        orderDTO.setCustomerId(input.getCustomerId() != null ? Integer.valueOf(input.getCustomerId()) : null);
        orderDTO.setCustomerName(input.getCustomerName());
        orderDTO.setTableId(Integer.valueOf(input.getTableId()));
        orderDTO.setNotes(input.getNotes());

        List<OrderItemDTO> items = input.getItems().stream()
                .map(item -> {
                    OrderItemDTO itemDTO = new OrderItemDTO();
                    itemDTO.setDishId(Integer.valueOf(item.getDishId()));
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setNotes(item.getNotes());
                    return itemDTO;
                })
                .collect(Collectors.toList());

        orderDTO.setItems(items);
        return orderDTO;
    }
}