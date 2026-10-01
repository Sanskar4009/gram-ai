package com.gramai.panchayat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PanchayatRepository extends JpaRepository<Panchayat, Long> {

    Optional<Panchayat> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    @Query("SELECT p FROM Panchayat p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.district) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.block) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.state) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Panchayat> searchPanchayats(@Param("search") String search, Pageable pageable);
}
