package com.siaas.academic;

import com.siaas.student.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "marks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false)
    private double internal;

    @Column(nullable = false)
    private double external;

    @Column(nullable = false)
    private double lab;

    @Column(nullable = false)
    private double assignment;

    @Column(nullable = false)
    private double total;

    @Column(length = 5)
    private String grade;

    @Column(name = "grade_points")
    private double gradePoints;
}
