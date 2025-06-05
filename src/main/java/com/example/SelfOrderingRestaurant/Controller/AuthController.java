package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.*;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.AuthResponseDto;
import com.example.SelfOrderingRestaurant.Service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.GeneralSecurityException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/staff/google-login")
    public ResponseEntity<AuthResponseDto> staffGoogleLogin(
            @Valid @RequestBody GoogleLoginRequestDto request
    ) throws GeneralSecurityException, IOException {
        return ResponseEntity.ok(authService.staffGoogleLogin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @Valid @RequestBody LoginRequestDto request, HttpSession session
    ) {
        AuthResponseDto response = authService.login(request);
        // Lưu trạng thái kết nối vào session
        session.setAttribute("isConnected", true);
        session.setAttribute("tableNumber", "1");
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponseDto> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDto request
    ) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDto request
    ) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDto request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}