package com.telemedicine.service;

import com.telemedicine.model.CarePlan;
import com.telemedicine.model.PatientContext;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class ConsultationStore {
  public final Map<String, PatientContext> contexts = new ConcurrentHashMap<>();
  public final Map<String, CarePlan> plans = new ConcurrentHashMap<>();
  public PatientContext context(String patientId) {
    return contexts.computeIfAbsent(patientId, id -> { PatientContext c = new PatientContext(); c.patientId = id; return c; });
  }
  public CarePlan plan(String consultationId) {
    return plans.computeIfAbsent(consultationId, id -> { CarePlan p = new CarePlan(); p.consultationId = id; return p; });
  }
}
