package com.siaas.student;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StudentControllerTest {

    @Autowired MockMvc mvc;

    private Cookie login(String email, String password) throws Exception {
        String loginBody = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
        MvcResult loginResult = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
            .andExpect(status().isOk())
            .andReturn();

        String setCookie = loginResult.getResponse().getHeader("Set-Cookie");
        String value = setCookie.split(";")[0].split("=", 2)[1];
        return new Cookie("access_token", value);
    }

    @Test
    void dashboard_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/v1/student/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void dashboard_withStudentAuth_returns200WithCgpa() throws Exception {
        Cookie cookie = login("student@siaas.dev", "Student@123");

        mvc.perform(get("/api/v1/student/dashboard")
                .cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.cgpa").isNumber())
            .andExpect(jsonPath("$.data.subjects").isArray())
            .andExpect(jsonPath("$.data.subjects.length()").value(6));
    }

    @Test
    void profile_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/v1/student/profile"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void profile_withStudentAuth_returns200WithName() throws Exception {
        Cookie cookie = login("student@siaas.dev", "Student@123");

        mvc.perform(get("/api/v1/student/profile")
                .cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.fullName").isString())
            .andExpect(jsonPath("$.data.rollNumber").isString());
    }

    @Test
    void academics_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/v1/student/academics"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void academics_withStudentAuth_returns200WithSemesters() throws Exception {
        Cookie cookie = login("student@siaas.dev", "Student@123");

        mvc.perform(get("/api/v1/student/academics")
                .cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.semesters").isArray())
            .andExpect(jsonPath("$.data.semesters.length()").value(1))
            .andExpect(jsonPath("$.data.semesters[0].semesterName").value("Semester 6 — 2026"))
            .andExpect(jsonPath("$.data.semesters[0].subjects.length()").value(6));
    }
}
