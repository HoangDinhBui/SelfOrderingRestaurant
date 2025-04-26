package com.example.SelfOrderingRestaurant.Security;

import com.example.SelfOrderingRestaurant.Service.JwtTokenService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SecurityUtils {
    private static final Logger log = LoggerFactory.getLogger(SecurityUtils.class);

    @Autowired
    private JwtTokenService jwtTokenService;

    /**
     * Check if the current user is authenticated
     * @return true if the user is authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getPrincipal().equals("anonymousUser")) {
            return false;
        }

        return true;
    }

    /**
     * Check if the current user has the specified role
     * @param role The role to check (without the "ROLE_" prefix)
     * @return true if the user has the role, false otherwise
     */
    public boolean hasRole(String role) {
        if (!isAuthenticated()) {
            return false;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String roleWithPrefix = "ROLE_" + role.toUpperCase();

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(roleWithPrefix));
    }

    /**
     * Get the current authenticated user's username
     * @return the username of the authenticated user, or null if not authenticated
     */
    public String getCurrentUsername() {
        if (!isAuthenticated()) {
            return null;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDetails) {
            return ((UserDetails) authentication.getPrincipal()).getUsername();
        }

        return authentication.getName();
    }

    /**
     * Get the roles of the current authenticated user
     * @return List of role names (without the "ROLE_" prefix)
     */
    public List<String> getCurrentUserRoles() {
        if (!isAuthenticated()) {
            return List.of();
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        return authorities.stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
    }

    /**
     * Check if the current user is an admin
     * @return true if the user has the ADMIN role, false otherwise
     */
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * Check if the current user is a staff member (including admins)
     * @return true if the user has the STAFF or ADMIN role, false otherwise
     */
    public boolean isStaff() {
        return hasRole("STAFF") || hasRole("ADMIN");
    }

    /**
     * Check if the current user is a customer
     * @return true if the user has the CUSTOMER role, false otherwise
     */
    public boolean isCustomer() {
        return hasRole("CUSTOMER");
    }

    /**
     * Validate a JWT token string
     * @param token The JWT token to validate
     * @return true if the token is valid and not expired, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            return !jwtTokenService.isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            log.warn("Token expired: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Invalid token: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }
}