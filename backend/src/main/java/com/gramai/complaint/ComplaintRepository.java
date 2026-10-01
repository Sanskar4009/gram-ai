package com.gramai.complaint;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByComplaintNumber(String complaintNumber);

    Optional<Complaint> findTopByComplaintNumberStartingWithOrderByComplaintNumberDesc(String prefix);

    Page<Complaint> findByPanchayatId(Long panchayatId, Pageable pageable);

    Page<Complaint> findByPanchayatIdAndCitizenId(Long panchayatId, Long citizenId, Pageable pageable);

    long countByPanchayatId(Long panchayatId);

    long countByPanchayatIdAndStatus(Long panchayatId, ComplaintStatus status);

    long countByPanchayatIdAndCategory(Long panchayatId, ComplaintCategory category);

    long countByPanchayatIdAndPriority(Long panchayatId, ComplaintPriority priority);

    @Query("SELECT c FROM Complaint c WHERE " +
            "(:panchayatId IS NULL OR c.panchayatId = :panchayatId) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:category IS NULL OR c.category = :category) AND " +
            "(:priority IS NULL OR c.priority = :priority) AND " +
            "(:assignedTo IS NULL OR c.assignedTo = :assignedTo) AND " +
            "(:citizenId IS NULL OR c.citizenId = :citizenId) AND " +
            "(:fromDate IS NULL OR c.createdAt >= :fromDate) AND " +
            "(:toDate IS NULL OR c.createdAt <= :toDate) AND " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(c.complaintNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " c.citizenId IN (SELECT cit.id FROM Citizen cit WHERE LOWER(cit.fullName) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<Complaint> findWithFilters(
            @Param("panchayatId") Long panchayatId,
            @Param("status") ComplaintStatus status,
            @Param("category") ComplaintCategory category,
            @Param("priority") ComplaintPriority priority,
            @Param("assignedTo") Long assignedTo,
            @Param("citizenId") Long citizenId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT c.category, COUNT(c) FROM Complaint c WHERE c.panchayatId = :panchayatId GROUP BY c.category")
    List<Object[]> countGroupedByCategory(@Param("panchayatId") Long panchayatId);

    @Query("SELECT c.priority, COUNT(c) FROM Complaint c WHERE c.panchayatId = :panchayatId GROUP BY c.priority")
    List<Object[]> countGroupedByPriority(@Param("panchayatId") Long panchayatId);
}
