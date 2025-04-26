package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Repository.ShiftRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class ShiftService implements IShiftService {

    private final ShiftRepository shiftRepository;

    @Transactional
    @Override
    public List<ShiftResponseDTO> getAllShifts() {
        return shiftRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public ShiftResponseDTO getShiftById(Integer id) {
        return shiftRepository.findById(id)
                .map(this::convertToResponseDTO)
                .orElse(null);
    }

    @Transactional
    @Override
    public ShiftResponseDTO createShift(ShiftRequestDTO shiftRequestDTO) {
        Shift shift = convertToEntity(shiftRequestDTO);
        Shift savedShift = shiftRepository.save(shift);
        return convertToResponseDTO(savedShift);
    }

    @Transactional
    @Override
    public ShiftResponseDTO updateShift(Integer id, ShiftRequestDTO shiftRequestDTO) {
        Optional<Shift> existingShift = shiftRepository.findById(id);
        if (existingShift.isPresent()) {
            Shift shift = existingShift.get();
            shift.setName(shiftRequestDTO.getName());
            shift.setStartTime(shiftRequestDTO.getStartTime());
            shift.setEndTime(shiftRequestDTO.getEndTime());
            Shift updatedShift = shiftRepository.save(shift);
            return convertToResponseDTO(updatedShift);
        }
        return null;
    }

    @Transactional
    @Override
    public void deleteShift(Integer id) {
        if(!shiftRepository.existsById(id)){
            throw new RuntimeException("Shift not found");
        }
        shiftRepository.deleteById(id);
    }

    private ShiftResponseDTO convertToResponseDTO(Shift shift) {
        ShiftResponseDTO dto = new ShiftResponseDTO();
        dto.setShiftId(shift.getShiftId());
        dto.setName(shift.getName());
        dto.setStartTime(shift.getStartTime());
        dto.setEndTime(shift.getEndTime());
        return dto;
    }

    private Shift convertToEntity(ShiftRequestDTO shiftRequestDTO) {
        Shift shift = new Shift();
        shift.setName(shiftRequestDTO.getName());
        shift.setStartTime(shiftRequestDTO.getStartTime());
        shift.setEndTime(shiftRequestDTO.getEndTime());
        return shift;
    }
}