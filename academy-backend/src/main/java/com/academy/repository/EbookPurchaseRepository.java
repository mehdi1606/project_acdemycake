package com.academy.repository;

import com.academy.entity.Ebook;
import com.academy.entity.EbookPurchase;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EbookPurchaseRepository extends JpaRepository<EbookPurchase, UUID> {

    boolean existsByUserAndEbook(User user, Ebook ebook);

    Optional<EbookPurchase> findByUserAndEbook(User user, Ebook ebook);

    List<EbookPurchase> findByUserOrderByPurchasedAtDesc(User user);
}
