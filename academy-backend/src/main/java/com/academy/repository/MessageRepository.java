package com.academy.repository;

import com.academy.entity.Message;
import com.academy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE " +
            "((m.sender = :user1 AND m.receiver = :user2 AND m.isDeletedBySender = false) OR " +
            "(m.sender = :user2 AND m.receiver = :user1 AND m.isDeletedByReceiver = false)) " +
            "ORDER BY m.createdAt DESC")
    Page<Message> findConversation(@Param("user1") User user1, @Param("user2") User user2, Pageable pageable);

    @Query("SELECT DISTINCT m.sender FROM Message m WHERE m.receiver = :user AND m.isDeletedByReceiver = false")
    List<User> findSenders(@Param("user") User user);

    @Query("SELECT DISTINCT m.receiver FROM Message m WHERE m.sender = :user AND m.isDeletedBySender = false")
    List<User> findReceivers(@Param("user") User user);

    @Query("SELECT m FROM Message m WHERE " +
            "((m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1)) " +
            "ORDER BY m.createdAt DESC LIMIT 1")
    Message findLastMessageBetween(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver = :user AND m.isRead = false AND m.isDeletedByReceiver = false")
    long countUnreadMessages(@Param("user") User user);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver = :receiver AND m.sender = :sender AND m.isRead = false")
    long countUnreadMessagesFromUser(@Param("receiver") User receiver, @Param("sender") User sender);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP WHERE m.receiver = :receiver AND m.sender = :sender AND m.isRead = false")
    void markConversationAsRead(@Param("receiver") User receiver, @Param("sender") User sender);
}
