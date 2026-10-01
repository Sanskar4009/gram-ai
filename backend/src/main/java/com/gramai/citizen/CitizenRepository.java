package com.gramai.citizen;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, Long> {

    Page<Citizen> findByPanchayatId(Long panchayatId, Pageable pageable);

    @Query("SELECT c FROM Citizen c WHERE " +
            "(:panchayatId IS NULL OR c.panchayatId = :panchayatId) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:village IS NULL OR :village = '' OR LOWER(c.village) = LOWER(:village)) AND " +
            "(:wardNumber IS NULL OR c.wardNumber = :wardNumber) AND " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(c.village) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " (c.mobile IS NOT NULL AND c.mobile LIKE CONCAT('%', :search, '%')))")
    Page<Citizen> findWithFilters(
            @Param("panchayatId") Long panchayatId,
            @Param("status") CitizenStatus status,
            @Param("village") String village,
            @Param("wardNumber") Integer wardNumber,
            @Param("search") String search,
            Pageable pageable
    );

    long countByPanchayatId(Long panchayatId);

    long countByPanchayatIdAndStatus(Long panchayatId, CitizenStatus status);

    List<Citizen> findByPanchayatIdAndFullNameIgnoreCase(Long panchayatId, String fullName);

    List<Citizen> findByPanchayatIdAndMobile(Long panchayatId, String mobile);

    List<Citizen> findByPanchayatIdAndFullNameIgnoreCaseAndVillageIgnoreCase(Long panchayatId, String fullName, String village);
}
