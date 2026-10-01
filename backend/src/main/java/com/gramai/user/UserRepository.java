package com.gramai.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    Optional<User> findByMobile(String mobile);

    boolean existsByMobile(String mobile);

    boolean existsByMobileAndIdNot(String mobile, Long id);

    Page<User> findByPanchayatId(Long panchayatId, Pageable pageable);

    long countByPanchayatId(Long panchayatId);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(u.mobile IS NOT NULL AND LOWER(u.mobile) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.panchayatId = :panchayatId AND (" +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(u.mobile IS NOT NULL AND LOWER(u.mobile) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<User> searchUsersByPanchayat(
            @Param("panchayatId") Long panchayatId,
            @Param("search") String search,
            Pageable pageable
    );
}
