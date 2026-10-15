package com.telemedicine.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CarePlan {
  public String consultationId;
  public String patientId;
  public String doctorId;
  public List<Diagnosis> diagnosis = new ArrayList<>();
  public List<Prescription> prescriptions = new ArrayList<>();
  public List<String> diagnosticTests = new ArrayList<>();
  public FollowUp followUp = new FollowUp();
  public MedicalLeave medicalLeave = new MedicalLeave();
  public String status = "DRAFT";
  public Instant updatedAt = Instant.now();
  public static class Diagnosis { public String code; public String name; public String notes; }
  public static class Prescription { public String medicationName; public String dosage; public String frequency; public String duration; public String instructions; }
  public static class FollowUp { public boolean enabled; public LocalDate date; public String instructions; }
  public static class MedicalLeave { public boolean enabled; public LocalDate startDate; public LocalDate endDate; public String reason; }
}
