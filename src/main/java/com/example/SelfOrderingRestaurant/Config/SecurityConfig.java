package com.example.SelfOrderingRestaurant.Config;

import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import com.example.SelfOrderingRestaurant.Security.CustomUserDetailsService;
import com.example.SelfOrderingRestaurant.Security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'self'; " +
                                                "style-src 'self' 'unsafe-inline'; " +
                                                "img-src 'self' data: http://localhost:8080 https://nhantien.momo.vn; " +
                                                "script-src 'self'; " +
                                                "connect-src 'self' ws://localhost:8080 http://localhost:8080"
                                )
                        )
                )
                .authorizeHttpRequests(authorize -> authorize
                        // --- Public: guests at a table are not logged in ---
                        .requestMatchers("/api/auth/**", "/api/captive/**", "/api/chatbot/**",
                                "/api/voice-order/**", "/ws/**", "/error").permitAll()
                        // GraphQL is public at the transport level; sensitive operations are
                        // guarded per resolver with @PreAuthorize
                        .requestMatchers("/graphql", "/graphql/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/dishes/**", "/api/categories/**", "/api/images/**",
                                "/uploads/**", "/api/inventory/available", "/api/dish_ingredients/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/feedback").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/notifications").permitAll()
                        // Payment: a guest may start a payment and watch its status, never settle it
                        .requestMatchers(HttpMethod.POST, "/api/payment/vnpay", "/api/payment/process",
                                "/api/payment/apply-points", "/api/payment/reset/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payment/vnpay_payment",
                                "/api/payment/payment/status/**").permitAll()
                        .requestMatchers("/api/payment/**").hasAnyRole("STAFF", "ADMIN")

                        // --- Staff & admin ---
                        .requestMatchers(HttpMethod.DELETE, "/api/dishes/**").hasRole("ADMIN")
                        .requestMatchers("/api/attendance/scan", "/api/attendance/manual", "/api/attendance/today").hasRole("STAFF")
                        .requestMatchers("/api/attendance/add-face", "/api/attendance/history",
                                "/api/attendance/pending", "/api/attendance/*/approval").hasRole("ADMIN")
                        .requestMatchers("/api/staff/**", "/api/orders/**", "/api/notifications/**",
                                "/api/receipts/**", "/api/dishes/**").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/shifts/**").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers("/api/customers/history").authenticated()
                        .requestMatchers("/api/customers/**").hasAnyRole("STAFF", "ADMIN")

                        // --- Admin only ---
                        .requestMatchers("/api/admin/**", "/api/shifts/**", "/api/salary/**", "/api/qr/**",
                                "/api/feedback/**", "/api/dish_ingredients/**", "/api/inventory/**",
                                "/api/categories/**", "/graphiql/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        // No/expired/invalid token -> 401 so the frontend can refresh; wrong role -> 403
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\"}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:[*]", "https://*.vercel.app", frontendUrl));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService(userRepository);
    }
}