package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO.CustomerRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO.CustomerResponseDTO;
import java.util.List;

public interface ICustomerService {
    List<CustomerResponseDTO> getAllCustomers();
    CustomerResponseDTO getCustomerById(Integer id);
    CustomerResponseDTO createCustomer(CustomerRequestDTO requestDTO);
    CustomerResponseDTO updateCustomer(Integer id, CustomerRequestDTO requestDTO);
    void deleteCustomer(Integer id);
}