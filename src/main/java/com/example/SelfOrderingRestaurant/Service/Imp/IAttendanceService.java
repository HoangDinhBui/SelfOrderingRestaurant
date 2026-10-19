package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;

import java.util.List;

public interface IAttendanceService {
    AttendanceResultDTO scan(String username, Attendance.AttendanceStatus type, byte[] image);

    AttendanceResultDTO manual(String username, Attendance.AttendanceStatus type, String reason);

    AttendanceTodayDTO today(String username);

    List<PendingAttendanceDTO> pending();

    void review(Integer attendanceId, boolean approved);
}
