package com.a3n.resumentor.service;

import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.repository.UserRepository;
import com.a3n.resumentor.util.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public String loginWithGoogle(String googleId, String email, String name, String profilePictureUrl) {
        log.info("Processing Google login for email: {}", email);

        User user = userRepository.findByGoogleId(googleId)
                .orElse(new User());

        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setName(name);
        user.setProfilePictureUrl(profilePictureUrl);
        user.setIsGuest(false);

        User savedUser = userRepository.save(user);
        log.info("User logged in with Google: {}", email);

        return jwtTokenProvider.generateToken(savedUser.getId());
    }

    public String loginAsGuest() {
        log.info("Processing guest login");

        User guestUser = new User();
        guestUser.setEmail("guest-" + System.currentTimeMillis() + "@resumentor.local");
        guestUser.setName("Guest User");
        guestUser.setIsGuest(true);

        User savedUser = userRepository.save(guestUser);
        log.info("Guest user logged in");

        return jwtTokenProvider.generateToken(savedUser.getId());
    }

    public User validateToken(String token) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
