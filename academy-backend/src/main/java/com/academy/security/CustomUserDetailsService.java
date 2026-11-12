package com.academy.security;

import com.academy.entity.User;
import com.academy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        return UserPrincipal.create(user);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        // A deleted account must stop working at once, even with a token issued before.
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new UsernameNotFoundException("User not found with id: " + id);
        }

        return UserPrincipal.create(user);
    }
}
