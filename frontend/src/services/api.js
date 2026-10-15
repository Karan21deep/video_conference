const API = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8080`;
export async function request(path, options={}) {
  const response = await fetch(`${API}${path}`, {headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}
export const contextApi = (patientId) => request(`/api/patients/${encodeURIComponent(patientId)}/context`);
export const saveCarePlan = (id, plan) => request(`/api/consultations/${encodeURIComponent(id)}/care-plan`, {method:'PUT',body:JSON.stringify(plan)});
export const getCarePlan = (id) => request(`/api/consultations/${encodeURIComponent(id)}/care-plan`);
export const finalizeCarePlan = (id) => request(`/api/consultations/${encodeURIComponent(id)}/care-plan/finalize`, {method:'POST'});
export const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080/ws`;
