package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtTokenService {
    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);

    public static final String TOKEN_TYPE_CLAIM = "type";
    public static final String ACCESS_TOKEN = "access";
    public static final String REFRESH_TOKEN = "refresh";

    @Value("${jwt.access-token.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token.expiration}")
    private long refreshTokenExpiration;

    @Value("${jwt.secret:}")
    private String secret;

    private SecretKey signingKey;

    @PostConstruct
    void initSigningKey() {
        if (secret == null || secret.isBlank()) {
            byte[] random = new byte[64];
            new SecureRandom().nextBytes(random);
            signingKey = Keys.hmacShaKeyFor(random);
            log.warn("JWT_SECRET is not set: using a random signing key. All tokens become invalid on restart. "
                    + "Set the JWT_SECRET environment variable (base64, >= 64 bytes) in every deployed environment.");
        } else {
            signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        }
    }

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, ACCESS_TOKEN);
        claims.put("userId", user.getUserId());
        claims.put("username", user.getUsername());
        claims.put("email", user.getEmail());
        claims.put("userType", user.getUserType());
        claims.put("roles", List.of("ROLE_" + user.getUserType()));

        return createToken(claims, user.getUsername(), accessTokenExpiration);
    }


    // Generate Refresh Token
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, REFRESH_TOKEN);
        claims.put("userId", user.getUserId());
        claims.put("username", user.getUsername());

        return createToken(claims, user.getUsername(), refreshTokenExpiration);
    }

    // Create Token
    private String createToken(Map<String, Object> claims, String subject, long expiration) {
        SecretKey key = signingKey;

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    // Get Signing Key
    private Key getSignKey() {
        return signingKey;
    }

    // Extract Username from Token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract Expiration from Token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Extract Claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extract All Claims
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Check if Token is Expired
    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate Refresh Token
    public Boolean validateRefreshToken(String token, User user) {
        return isValid(token, user, REFRESH_TOKEN);
    }

    // Validate Access Token
    public Boolean validateAccessToken(String token, User user) {
        return isValid(token, user, ACCESS_TOKEN);
    }

    private boolean isValid(String token, User user, String expectedType) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject().equals(user.getUsername())
                && expectedType.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))
                && claims.getExpiration().after(new Date())
                && !isRevoked(claims.getIssuedAt(), user.getTokensValidAfter());
    }

    // A token issued before the user's last logout is revoked. JWT iat has second precision.
    static boolean isRevoked(Date issuedAt, Instant tokensValidAfter) {
        if (tokensValidAfter == null) {
            return false;
        }
        if (issuedAt == null) {
            return true;
        }
        return issuedAt.toInstant().getEpochSecond() < tokensValidAfter.getEpochSecond();
    }

    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);

        // Try to get roles from the claims
        List<String> roles = claims.get("roles", List.class);

        // If roles is null, use the userType as a fallback
        if (roles == null && claims.get("userType") != null) {
            String userType = claims.get("userType", String.class);
            return List.of("ROLE_" + userType);
        }

        return roles;
    }
}
