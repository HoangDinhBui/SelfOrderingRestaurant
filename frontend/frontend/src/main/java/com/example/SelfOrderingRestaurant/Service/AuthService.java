package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.*;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.AuthResponseDto;
import com.example.SelfOrderingRestaurant.Entity.Customer;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.websocket.AuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${google.client-id}")
    private String googleClientId;

    private final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setUserType(UserType.CUSTOMER);
        user.setUserStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Create customer profile
        Customer customer = new Customer();
        customer.setUser(savedUser);
        customer.setFullname(request.getFullname());
        customer.setJoinDate(new Date());
        customer.setPoints(0);
        customerRepository.save(customer);

        // Generate tokens
        String accessToken = jwtTokenService.generateAccessToken(savedUser);
        String refreshToken = jwtTokenService.generateRefreshToken(savedUser);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(savedUser.getUsername());
        response.setEmail(savedUser.getEmail());
        response.setUserType(savedUser.getUserType().name());

        return response;
    }

    public AuthResponseDto login(LoginRequestDto request) {
        System.out.println("Before authentication");
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );
        System.out.println("After authentication");

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(),
                request.getUsernameOrEmail()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        // Update last login
        user.setLastLogin(new Date());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtTokenService.generateAccessToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setUserType(user.getUserType().name());

        return response;
    }

    @Transactional
    public AuthResponseDto googleLogin(GoogleLoginRequestDto request) throws GeneralSecurityException, IOException {
        try {
            log.info("Server Google Client ID: {}", googleClientId);
            log.info("Received ID Token: {}", request.getIdToken());

            // Decode token without verification first to inspect
            GoogleIdToken parsedToken = GoogleIdToken.parse(
                    new GsonFactory(),
                    request.getIdToken()
            );

            if (parsedToken != null) {
                GoogleIdToken.Payload payload = parsedToken.getPayload();

                log.info("Token Details:");
                log.info("Issuer: {}", payload.getIssuer());
                log.info("Audience: {}", payload.getAudience());
                log.info("Subject: {}", payload.getSubject());
                log.info("Email: {}", payload.getEmail());
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .setIssuer("https://accounts.google.com")
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());

            if (idToken == null) {
                throw new AuthenticationException(
                        "Token verification failed. Possible causes: " +
                                "incorrect client ID, expired token, or network issues."
                );
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            // Additional payload validation
            validateTokenPayload(payload);

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Check if user exists with Google ID
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);

            User user = existingUser.orElseGet(() -> {
//                if (request.getPassword() == null || request.getPassword().isEmpty()) {
//                    throw new AuthenticationException("Password is required for Google login.");
//                }
                // Create new user if not exists
                User newUser = new User();
                newUser.setGoogleId(googleId);
                newUser.setEmail(email);
                newUser.setUsername(email.split("@")[0]);
                newUser.setUserType(UserType.CUSTOMER);
                newUser.setUserStatus(UserStatus.ACTIVE);
                newUser.setCreatedAt(LocalDateTime.now());
                newUser.setLastLogin(new Date());

                //newUser.setPassword(passwordEncoder.encode(request.getPassword()));

                User savedUser = userRepository.save(newUser);

                // Create customer profile
                Customer customer = new Customer();
                customer.setUser(savedUser);
                customer.setFullname(name != null ? name : email.split("@")[0]);
                customer.setJoinDate(new Date());
                customer.setPoints(0);
                customerRepository.save(customer);

                return savedUser;
            });

            // Generate tokens
            String accessToken = jwtTokenService.generateAccessToken(user);
            String refreshToken = jwtTokenService.generateRefreshToken(user);

            // Return response
            AuthResponseDto response = new AuthResponseDto();
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());
            response.setUserType(user.getUserType().name());

            return response;
        } catch (GeneralSecurityException | IOException e) {
            // Log the actual exception details
            // Replace with proper logging mechanism
            log.error("Google authentication failed", e);
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }

    private void validateTokenPayload(GoogleIdToken.Payload payload) {
        if (payload == null) {
            throw new AuthenticationException("Invalid token payload");
        }

        // Additional checks
        if (!payload.getEmail().endsWith("@gmail.com")) {
            throw new AuthenticationException("Invalid email domain");
        }

        // Optional: Add more specific validation rules
        if (payload.getExpirationTimeSeconds() != null &&
                payload.getExpirationTimeSeconds() < System.currentTimeMillis() / 1000) {
            throw new AuthenticationException("Token has expired");
        }
    }

    public class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }

    public void logout() {
        // Clear security context
        SecurityContextHolder.clearContext();
    }

    public AuthResponseDto refreshToken(RefreshTokenRequestDto request) {
        // Validate refresh token
        String username = jwtTokenService.extractUsername(request.getRefreshToken());
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify refresh token
        if (!jwtTokenService.validateRefreshToken(request.getRefreshToken(), user)) {
            throw new RuntimeException("Invalid refresh token");
        }

        // Generate new tokens
        String newAccessToken = jwtTokenService.generateAccessToken(user);
        String newRefreshToken = jwtTokenService.generateRefreshToken(user);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setUserType(user.getUserType().name());

        return response;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDto request) {
        // Validate email input
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email must not be empty");
        }

        // Optional: Add email format validation
        if (!isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        // Generate reset token
        String resetToken = UUID.randomUUID().toString();

        // Set reset token with explicit null checks
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordExpiry(LocalDateTime.now().plusHours(1));

        try {
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        } catch (Exception e) {
            // Log the actual exception
            throw new RuntimeException("Failed to process password reset", e);
        }
    }

    // Optional email validation method
    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return email != null && email.matches(emailRegex);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequestDto request) {
        User user = userRepository.findByResetPasswordToken(request.getResetToken())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        // Check token expiry
        if (user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);
    }
}
