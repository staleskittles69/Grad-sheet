package com.siaas.faculty;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FacultyRepository extends JpaRepository<Faculty, UUID> {

    Optional<Faculty> findByUser_Id(UUID userId);

    long countByDepartment_Id(UUID departmentId);

    @Query("""
        SELECT f FROM Faculty f
        JOIN FETCH f.user
        LEFT JOIN FETCH f.department
        WHERE f.id = :id
        """)
    Optional<Faculty> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
        SELECT f FROM Faculty f
        JOIN FETCH f.user
        LEFT JOIN FETCH f.department
        WHERE (:q IS NULL OR LOWER(f.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
                          OR LOWER(f.employeeId) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY f.fullName
        """)
    List<Faculty> search(@Param("q") String q);

    @Query("""
        SELECT f FROM Faculty f
        JOIN FETCH f.user
        LEFT JOIN FETCH f.department
        ORDER BY f.createdAt DESC
        """)
    List<Faculty> findRecent(Pageable pageable);
}
