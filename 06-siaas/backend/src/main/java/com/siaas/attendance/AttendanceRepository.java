package com.siaas.attendance;

import com.siaas.student.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    @Query("""
        SELECT a.subject.id, COUNT(a)
        FROM Attendance a
        WHERE a.student = :student AND a.status = 'PRESENT'
        GROUP BY a.subject.id
        """)
    List<Object[]> getPresentCountBySubject(@Param("student") Student student);

    @Query("""
        SELECT a.subject.id, COUNT(a)
        FROM Attendance a
        WHERE a.student = :student
        GROUP BY a.subject.id
        """)
    List<Object[]> getTotalCountBySubject(@Param("student") Student student);

    @Query("""
        SELECT a FROM Attendance a
        WHERE a.student.id = :studentId AND a.subject.id = :subjectId
        ORDER BY a.date DESC
        """)
    List<Attendance> findByStudentAndSubject(@Param("studentId") java.util.UUID studentId,
                                              @Param("subjectId") java.util.UUID subjectId);

    boolean existsBySubject_Id(java.util.UUID subjectId);
}
