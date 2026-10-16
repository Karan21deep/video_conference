# CareConnect: Doctor–Patient LAN Telemedicine Starter

Java 21 + Spring Boot REST/WebSocket backend and React/Vite frontend. Includes one-to-one WebRTC audio/video, shared chat, doctor Context/Chat/Vitals/Care Plan tabs, patient context ingestion, and a JSON care-plan API.

> This is a development starter, not a production-ready clinical system. It uses in-memory storage, has no authentication/authorization, and does not implement medical-record retention, audit trails, encryption-at-rest, or clinical workflow approvals. Do not use real patient data until these are implemented and reviewed.

## Requirements
- JDK 21 (not just a JRE), with `JAVA_HOME` and `%JAVA_HOME%\bin` in `PATH`
- Maven 3.9+
- Node.js 20+ and npm
- Both devices connected to the same LAN

Check on Windows PowerShell:
```powershell
java -version
javac -version
mvn -version
node -v
npm -v
```

## Start backend
```powershell
cd backend
mvn spring-boot:run
```
Backend listens on `0.0.0.0:8080`.

## Start frontend
Open another terminal:
```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```
Open `http://localhost:5173` on the host computer. Find the host LAN IPv4 address with `ipconfig`; other devices can open `http://HOST-LAN-IP:5173`.

### Browser camera/microphone note
Browsers normally allow camera/microphone only in a secure context: `localhost` or HTTPS. For other LAN devices, configure local HTTPS for the frontend and use a trusted local certificate on both devices. Allow camera and microphone permissions. Configure Windows Firewall to allow the frontend and backend ports. The signaling server relays SDP/ICE messages; media is peer-to-peer when the network allows it. This starter sets `iceServers: []` for LAN-only connectivity; if peers cannot establish a route, deploy a TURN server reachable on the LAN and add it to `RTCPeerConnection` configuration.

## Open the two interfaces
Use the same room and patient IDs on both devices:
- Doctor: `http://HOST:5173/?role=doctor&room=CONS-2001&patient=PAT-1001`
- Patient: `http://HOST:5173/?role=patient&room=CONS-2001&patient=PAT-1001`

The doctor view has Context, Chat, Vitals and Care plan tabs. The patient view has shared Chat plus camera/microphone and hang-up controls. Keep the consultation room ID private.

## API examples
Health check:
```http
GET http://localhost:8080/api/health
```

Ingest context from your existing clinical system:
```http
POST http://localhost:8080/api/patients/PAT-1001/context
Content-Type: application/json
```
```json
{
  "consultationId": "CONS-2001",
  "reasonForVisit": "Sore throat and fever",
  "allergies": [{"name": "Penicillin", "reaction": "Rash"}],
  "conditions": ["Asthma"],
  "medications": [],
  "medicalHistory": ["Recurrent tonsillitis"],
  "symptoms": [{"name": "Fever", "duration": "2 days", "severity": "6/10"}],
  "quickChecks": [{"question": "Difficulty breathing?", "answer": "No"}]
}
```

Read patient context:
```http
GET http://localhost:8080/api/patients/PAT-1001/context
```

Save care plan (the UI calls this endpoint):
```http
PUT http://localhost:8080/api/consultations/CONS-2001/care-plan
Content-Type: application/json
```
```json
{
  "patientId": "PAT-1001",
  "doctorId": "DOC-1001",
  "diagnosis": [{"code": "", "name": "", "notes": ""}],
  "prescriptions": [{"medicationName": "", "dosage": "", "frequency": "", "duration": "", "instructions": ""}],
  "diagnosticTests": [],
  "followUp": {"enabled": false, "date": null, "instructions": ""},
  "medicalLeave": {"enabled": false, "startDate": null, "endDate": null, "reason": ""},
  "status": "DRAFT"
}
```

Finalize plan:
```http
POST http://localhost:8080/api/consultations/CONS-2001/care-plan/finalize
```
The response is the care-plan JSON with `status: FINALIZED`; your downstream service can consume this response. In production, secure the endpoint and publish final plans through an authenticated integration/event or webhook with retries and audit logging.

## API summary
- `GET /api/health`
- `POST /api/patients/{patientId}/context` — ingest/replace patient context
- `GET /api/patients/{patientId}/context`
- `GET /api/consultations/{consultationId}/care-plan`
- `PUT /api/consultations/{consultationId}/care-plan` — save draft or finalized payload
- `POST /api/consultations/{consultationId}/care-plan/finalize`
- `WS /ws` — signaling and chat relay; messages must include `roomId` and `type`

## Notes for integration/production
- Replace in-memory maps with a database; data is lost when the backend restarts.
- Add authentication and role-based authorization for doctor/patient, room membership checks, rate limits, and audit trails.
- Restrict CORS and WebSocket origins to trusted origins.
- Validate context/care-plan schemas and use versioned API contracts.
- Use TLS for HTTP and WebSocket (`wss://`) and protect health information in transit and at rest.
- The `AI assistant` switch is a UI placeholder only; no AI model is connected.
- Vitals are blank placeholders until a device or authorized data API supplies them.
