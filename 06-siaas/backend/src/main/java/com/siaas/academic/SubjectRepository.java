package com.siaas.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    long countByDepartment_Id(UUID departmentId);

    @Query("SELECT s FROM Subject s LEFT JOIN FETCH s.department ORDER BY s.name")
    List<Subject> findAllWithDepartment();
}
