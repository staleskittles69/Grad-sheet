package com.siaas.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired MockMvc mvc;
    private final ObjectMapper mapper = new ObjectMapper();

    private Cookie login(String email, String password) throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        String value = setCookie.split(";")[0].split("=", 2)[1];
        return new Cookie("access_token", value);
    }

    private JsonNode data(MvcResult result) throws Exception {
        return mapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    private String unique() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void stats_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/v1/admin/stats")).andExpect(status().isUnauthorized());
    }

    @Test
    void stats_withStudentAuth_returns403() throws Exception {
        Cookie cookie = login("student@siaas.dev", "Student@123");
        mvc.perform(get("/api/v1/admin/stats").cookie(cookie))
            .andExpect(status().isForbidden());
    }

    @Test
    void stats_withAdminAuth_returns200WithCounts() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");
        mvc.perform(get("/api/v1/admin/stats").cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalStudents").isNumber())
            .andExpect(jsonPath("$.data.totalFaculty").isNumber())
            .andExpect(jsonPath("$.data.activeSubjects").value(6))
            .andExpect(jsonPath("$.data.totalDepartments").isNumber())
            .andExpect(jsonPath("$.data.recentFaculty[0].subjectCodes").isArray());
    }

    @Test
    void departmentCrud_createUpdateDelete() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");
        String code = "D" + unique();

        MvcResult create = mvc.perform(post("/api/v1/admin/departments")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Electronics\",\"code\":\"" + code + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.code").value(code))
            .andReturn();
        String id = data(create).get("id").asText();

        mvc.perform(put("/api/v1/admin/departments/" + id)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Electronics & Comm.\",\"code\":\"" + code + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Electronics & Comm."));

        mvc.perform(delete("/api/v1/admin/departments/" + id).cookie(cookie))
            .andExpect(status().isOk());
    }

    @Test
    void deleteDepartment_withLinkedStudents_returns409() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");
        MvcResult students = mvc.perform(get("/api/v1/admin/students?q=CS21B001").cookie(cookie))
            .andExpect(status().isOk()).andReturn();
        String deptId = data(students).get(0).get("departmentId").asText();

        mvc.perform(delete("/api/v1/admin/departments/" + deptId).cookie(cookie))
            .andExpect(status().isConflict());
    }

    @Test
    void studentCrud_createAndToggleActive() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");
        String suffix = unique();
        MvcResult depts = mvc.perform(get("/api/v1/admin/departments").cookie(cookie)).andReturn();
        String deptId = data(depts).get(0).get("id").asText();

        String body = """
            {"email":"student-%s@siaas.dev","password":"NewStud@123","fullName":"Test Student",
             "rollNumber":"CS-%s","semester":3,"section":"A","departmentId":"%s","admissionYear":2023}
            """.formatted(suffix, suffix, deptId);

        MvcResult create = mvc.perform(post("/api/v1/admin/students")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.active").value(true))
            .andReturn();
        String studentId = data(create).get("id").asText();

        mvc.perform(patch("/api/v1/admin/students/" + studentId).cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    void facultyCrud_createAssignsSubjects() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");
        String suffix = unique();
        MvcResult subjects = mvc.perform(get("/api/v1/admin/subjects").cookie(cookie)).andReturn();
        String subjectId = data(subjects).get(0).get("id").asText();

        String body = """
            {"email":"faculty-%s@siaas.dev","password":"NewFac@123","fullName":"Test Faculty",
             "employeeId":"FAC-%s","designation":"Professor","subjectIds":["%s"]}
            """.formatted(suffix, suffix, subjectId);

        mvc.perform(post("/api/v1/admin/faculty")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.subjectCodes.length()").value(1));
    }

    @Test
    void marksOverride_getAndUpdate() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");

        MvcResult students = mvc.perform(get("/api/v1/admin/students?q=CS21B001").cookie(cookie)).andReturn();
        String studentId = data(students).get(0).get("id").asText();

        MvcResult semesters = mvc.perform(get("/api/v1/admin/semesters").cookie(cookie)).andReturn();
        String semesterId = data(semesters).get(0).get("id").asText();

        MvcResult marks = mvc.perform(get("/api/v1/admin/marks")
                .cookie(cookie)
                .param("studentId", studentId)
                .param("semesterId", semesterId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(6))
            .andReturn();
        String markId = data(marks).get(0).get("id").asText();

        mvc.perform(patch("/api/v1/admin/marks/" + markId)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"internal\":25,\"external\":55,\"lab\":8,\"assignment\":7}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.total").value(95.0))
            .andExpect(jsonPath("$.data.grade").value("O"));
    }

    @Test
    void attendanceOverride_getAndUpdate() throws Exception {
        Cookie cookie = login("admin@siaas.dev", "Admin@123");

        MvcResult students = mvc.perform(get("/api/v1/admin/students?q=CS21B001").cookie(cookie)).andReturn();
        String studentId = data(students).get(0).get("id").asText();

        MvcResult subjects = mvc.perform(get("/api/v1/admin/subjects").cookie(cookie)).andReturn();
        String subjectId = data(subjects).get(0).get("id").asText();

        MvcResult attendance = mvc.perform(get("/api/v1/admin/attendance")
                .cookie(cookie)
                .param("studentId", studentId)
                .param("subjectId", subjectId))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode rows = data(attendance);
        assertTrue(rows.size() > 0);
        String attendanceId = rows.get(0).get("id").asText();
        String currentStatus = rows.get(0).get("status").asText();
        String newStatus = currentStatus.equals("PRESENT") ? "ABSENT" : "PRESENT";

        mvc.perform(patch("/api/v1/admin/attendance/" + attendanceId)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + newStatus + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value(newStatus));
    }
}
