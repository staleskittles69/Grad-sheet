package com.siaas.faculty;

import com.siaas.academic.Department;
import com.siaas.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "faculty")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String designation;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
