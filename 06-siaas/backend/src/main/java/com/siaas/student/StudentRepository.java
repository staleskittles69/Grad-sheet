package com.siaas.student;

import com.siaas.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByUser(User user);

    long countByDepartment_Id(UUID departmentId);

    @Query("""
        SELECT s FROM Student s
        JOIN FETCH s.user
        LEFT JOIN FETCH s.department
        WHERE s.id = :id
        """)
    Optional<Student> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
        SELECT s FROM Student s
        JOIN FETCH s.user
        LEFT JOIN FETCH s.department
        WHERE (:q IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
                          OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY s.fullName
        """)
    List<Student> search(@Param("q") String q);

    @Query("""
        SELECT s FROM Student s
        JOIN FETCH s.user
        LEFT JOIN FETCH s.department
        ORDER BY s.createdAt DESC
        """)
    List<Student> findRecent(Pageable pageable);
}
