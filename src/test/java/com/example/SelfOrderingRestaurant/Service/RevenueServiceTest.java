package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import com.example.SelfOrderingRestaurant.Entity.Revenue;
import com.example.SelfOrderingRestaurant.Repository.OrderItemRepository;
import com.example.SelfOrderingRestaurant.Repository.RevenueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RevenueServiceTest {

    // 2026-10-19 23:30 in Vietnam is still 16:30 UTC: the revenue day must be the Vietnam one
    private static final Clock VN_CLOCK = Clock.fixed(Instant.parse("2026-10-19T16:30:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final Clock VN_NEXT_DAY = Clock.fixed(Instant.parse("2026-10-19T17:30:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    private RevenueRepository revenueRepository;
    private OrderItemRepository orderItemRepository;
    private Order order;

    @BeforeEach
    void setUp() {
        revenueRepository = mock(RevenueRepository.class);
        orderItemRepository = mock(OrderItemRepository.class);
        order = new Order();
        order.setOrderId(1);
        order.setDiscount(BigDecimal.valueOf(5000));
        when(orderItemRepository.findByOrderOrderId(1)).thenReturn(List.of(
                item("Món chính", 50000, 2),
                item("Đồ uống", 25000, 1)));
    }

    @Test
    void firstPaidOrderOfTheDayCreatesRow() {
        when(revenueRepository.findByDate(any())).thenReturn(Optional.empty());

        new RevenueService(revenueRepository, orderItemRepository, VN_CLOCK)
                .recordPaidOrder(order, BigDecimal.valueOf(120000));

        Revenue saved = captureSaved();
        assertEquals(LocalDate.of(2026, 10, 19), saved.getDate());
        assertEquals(0, BigDecimal.valueOf(120000).compareTo(saved.getTotalRevenue()));
        assertEquals(1, saved.getTotalOrders());
        assertEquals(0, BigDecimal.valueOf(100000).compareTo(saved.getFoodRevenue()));
        assertEquals(0, BigDecimal.valueOf(25000).compareTo(saved.getDrinkRevenue()));
        assertEquals(0, BigDecimal.valueOf(5000).compareTo(saved.getTotalDiscount()));
    }

    @Test
    void laterOrderAccumulatesIntoSameRow() {
        Revenue existing = new Revenue();
        existing.setDate(LocalDate.of(2026, 10, 19));
        existing.setTotalRevenue(BigDecimal.valueOf(80000));
        existing.setTotalOrders(2);
        existing.setTotalCustomers(2);
        when(revenueRepository.findByDate(LocalDate.of(2026, 10, 19))).thenReturn(Optional.of(existing));

        new RevenueService(revenueRepository, orderItemRepository, VN_CLOCK)
                .recordPaidOrder(order, BigDecimal.valueOf(120000));

        Revenue saved = captureSaved();
        assertSame(existing, saved);
        assertEquals(0, BigDecimal.valueOf(200000).compareTo(saved.getTotalRevenue()));
        assertEquals(3, saved.getTotalOrders());
    }

    @Test
    void usesVietnamDateAfterUtcMidnightGap() {
        when(revenueRepository.findByDate(any())).thenReturn(Optional.empty());

        new RevenueService(revenueRepository, orderItemRepository, VN_NEXT_DAY)
                .recordPaidOrder(order, BigDecimal.TEN);

        assertEquals(LocalDate.of(2026, 10, 20), captureSaved().getDate());
    }

    private Revenue captureSaved() {
        ArgumentCaptor<Revenue> captor = ArgumentCaptor.forClass(Revenue.class);
        verify(revenueRepository).save(captor.capture());
        return captor.getValue();
    }

    private static OrderItem item(String categoryName, long price, int qty) {
        Category category = new Category();
        category.setName(categoryName);
        Dish dish = new Dish();
        dish.setCategory(category);
        OrderItem item = new OrderItem();
        item.setDish(dish);
        item.setUnitPrice(BigDecimal.valueOf(price));
        item.setQuantity(qty);
        return item;
    }
}
