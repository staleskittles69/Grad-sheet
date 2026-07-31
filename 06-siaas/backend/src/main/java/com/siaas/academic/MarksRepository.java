package com.siaas.academic;

import com.siaas.student.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MarksRepository extends JpaRepository<Marks, UUID> {

    @Query("""
        SELECT m FROM Marks m
        JOIN FETCH m.subject
        JOIN FETCH m.semester
        WHERE m.student = :student AND m.semester.active = true
        """)
    List<Marks> findCurrentByStudent(@Param("student") Student student);

    @Query("""
        SELECT m FROM Marks m
        JOIN FETCH m.subject
        JOIN FETCH m.semester
        WHERE m.student = :student
        """)
    List<Marks> findAllByStudent(@Param("student") Student student);

    @Query("""
        SELECT m FROM Marks m
        JOIN FETCH m.subject
        WHERE m.student.id = :studentId AND m.semester.id = :semesterId
        ORDER BY m.subject.code
        """)
    List<Marks> findByStudentAndSemester(@Param("studentId") java.util.UUID studentId,
                                          @Param("semesterId") java.util.UUID semesterId);

    boolean existsBySemester_Id(java.util.UUID semesterId);

    boolean existsBySubject_Id(java.util.UUID subjectId);
}
