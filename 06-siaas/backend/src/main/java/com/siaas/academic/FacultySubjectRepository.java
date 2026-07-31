package com.siaas.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface FacultySubjectRepository extends JpaRepository<FacultySubject, UUID> {

    @Query("SELECT fs.subject FROM FacultySubject fs WHERE fs.faculty.id = :facultyId ORDER BY fs.subject.code")
    List<Subject> findSubjectsByFacultyId(@Param("facultyId") UUID facultyId);

    void deleteByFaculty_Id(UUID facultyId);
}
