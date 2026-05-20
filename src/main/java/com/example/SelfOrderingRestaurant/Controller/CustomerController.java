package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO.CustomerResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO.CustomerRequestDTO;
import com.example.SelfOrderingRestaurant.Service.CustomerService;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Security.SecurityUtils;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    public CustomerController(CustomerService customerService, OrderService orderService, SecurityUtils securityUtils) {
        this.customerService = customerService;
        this.orderService = orderService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/history")
    public ResponseEntity<?> getOrderHistory() {
        try {
            if (!securityUtils.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User must be logged in to view history");
            }
            String username = securityUtils.getCurrentUsername();
            List<OrderResponseDTO> history = orderService.getCustomerOrderHistory(username);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Integer id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDTO> createCustomer(@RequestBody CustomerRequestDTO requestDTO) {
        return ResponseEntity.ok(customerService.createCustomer(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> updateCustomer(@PathVariable Integer id,
                                                              @RequestBody CustomerRequestDTO requestDTO) {
        return ResponseEntity.ok(customerService.updateCustomer(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCustomer(@PathVariable Integer id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok("Customer deleted successfully");
    }
}
