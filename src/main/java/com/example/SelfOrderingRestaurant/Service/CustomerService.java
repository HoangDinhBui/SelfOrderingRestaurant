package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO.CustomerRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO.CustomerResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Customer;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {
    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<CustomerResponseDTO> getAllCustomers() {
        return customerRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public CustomerResponseDTO getCustomerById(Integer id) {
       return customerRepository.findById(id)
               .map(this::mapToDTO)
               .orElse(null);
    }


    public CustomerResponseDTO createCustomer(CustomerRequestDTO requestDTO) {
        Customer customer = new Customer();
        customer.setFullname(requestDTO.getFullname());
        customer.setJoinDate(requestDTO.getJoinDate());
        customer.setPoints(requestDTO.getPoints());
        return mapToDTO(customerRepository.save(customer));
    }

    public CustomerResponseDTO updateCustomer(Integer id, CustomerRequestDTO requestDTO) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customer.setFullname(requestDTO.getFullname());
        customer.setPoints(requestDTO.getPoints());
        return mapToDTO(customerRepository.save(customer));
    }

    public void deleteCustomer(Integer id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("Customer not found");
        }
        customerRepository.deleteById(id);
    }

    private CustomerResponseDTO mapToDTO(Customer customer) {
        return new CustomerResponseDTO(
                customer.getCustomerId(),
                customer.getFullname(),
                customer.getJoinDate(),
                customer.getPoints()
        );
    }
}
