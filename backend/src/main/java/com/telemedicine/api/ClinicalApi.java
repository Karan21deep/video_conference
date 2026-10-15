package com.telemedicine.api;

import com.telemedicine.model.CarePlan;
import com.telemedicine.model.PatientContext;
import com.telemedicine.service.ConsultationStore;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.Map;

@RestController @RequestMapping("/api")
public class ClinicalApi {
  private final ConsultationStore store;
  public ClinicalApi(ConsultationStore store) { this.store = store; }

  @GetMapping("/health") public Map<String,Object> health() { return Map.of("status","UP","service","telemedicine-api"); }

  // External upstream system can POST patient context to this endpoint.
  @PostMapping("/patients/{patientId}/context")
  public PatientContext ingestContext(@PathVariable String patientId, @RequestBody PatientContext context) {
    context.patientId = patientId;
    store.contexts.put(patientId, context);
    return context;
  }
  @GetMapping("/patients/{patientId}/context")
  public PatientContext getContext(@PathVariable String patientId) { return store.context(patientId); }

  @GetMapping("/consultations/{consultationId}/care-plan")
  public CarePlan getPlan(@PathVariable String consultationId) { return store.plan(consultationId); }

  @PutMapping("/consultations/{consultationId}/care-plan")
  public CarePlan savePlan(@PathVariable String consultationId, @RequestBody CarePlan input) {
    input.consultationId = consultationId;
    input.updatedAt = Instant.now();
    if (input.status == null || input.status.isBlank()) input.status = "DRAFT";
    if (!input.status.equals("DRAFT") && !input.status.equals("FINALIZED")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be DRAFT or FINALIZED");
    store.plans.put(consultationId, input);
    return input;
  }

  @PostMapping("/consultations/{consultationId}/care-plan/finalize")
  public CarePlan finalizePlan(@PathVariable String consultationId) {
    CarePlan plan = store.plan(consultationId);
    plan.status = "FINALIZED"; plan.updatedAt = Instant.now();
    return plan;
  }
}
