package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.CreateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.UpdateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Supplier;

import java.util.List;

public interface ISupplierService {
    List<Supplier> getAllSuppliers();
    Supplier getSupplierById(Integer id);
    void createSupplier(CreateSupplierRequestDTO request);
    void updateSupplier(Integer id, UpdateSupplierRequestDTO request);
    boolean deleteSupplier(Integer id);
}