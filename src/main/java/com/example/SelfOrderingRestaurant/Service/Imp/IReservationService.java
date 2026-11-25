package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO.ReservationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.PublicTableDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.ReservationResponseDTO;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;

import java.time.LocalDate;
import java.util.List;

public interface IReservationService {
    ReservationResponseDTO createByCustomer(ReservationRequestDTO request);
    ReservationResponseDTO createManual(ReservationRequestDTO request);
    List<PublicTableDTO> getPublicTables();
    List<ReservationResponseDTO> list(LocalDate date, OrderStatus status);
    ReservationResponseDTO confirm(Integer orderId);
    ReservationResponseDTO reject(Integer orderId);
    ReservationResponseDTO checkIn(Integer orderId);
    ReservationResponseDTO cancel(Integer orderId);
    ReservationResponseDTO changeTable(Integer orderId, Integer tableId);
}
