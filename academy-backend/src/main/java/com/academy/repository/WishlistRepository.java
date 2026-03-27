package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    Optional<Wishlist> findByUserAndCourse(User user, Course course);

    boolean existsByUserAndCourse(User user, Course course);

    Page<Wishlist> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    void deleteByUserAndCourse(User user, Course course);

    long countByUser(User user);
}
