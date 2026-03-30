const API_BASE = "http://localhost:8000";

export type EvaluateBody = {
  experiment_name: string;
  device: string;
  dataset: {
    name: string;
    root: string;
    batch_size: number;
    num_workers: number;
  };
  model: {
    architecture: string;
    pretrained: boolean;
    weights_path: string | null;
    num_classes: number;
    input_size: [number, number, number];
  };
  attacks: {
    fgsm?: { enabled: boolean; eps?: number };
    pgd?: { enabled: boolean; eps?: number; alpha?: number; steps?: number };
    cw?: { enabled: boolean; c?: number; kappa?: number; steps?: number; lr?: number };
    jsma?: { enabled: boolean };
    deepfool?: { enabled: boolean };
  };
  evaluation: {
    results_dir: string;
  };
};

export type EvaluateResponse = {
  job_id: string;
  status: "running";
};

export type StatusResponse = {
  job_id: string;
  status: "running" | "completed" | "failed";
};

export type ResultResponse =
  | { job_id: string; status: "running" }
  | { job_id: string; status: "failed"; error?: string }
  | { job_id: string; status: "completed"; metrics: Record<string, unknown> };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function startEvaluation(body: EvaluateBody) {
  return request<EvaluateResponse>("/evaluate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getStatus(jobId: string) {
  return request<StatusResponse>(`/status/${jobId}`);
}

export function getResult(jobId: string) {
  return request<ResultResponse>(`/result/${jobId}`);
}

export function checkResultsExist(resultsDir: string) {
  return request<{ exists: boolean }>(`/check-results`, {
    method: "POST",
    body: JSON.stringify({ results_dir: resultsDir }),
  });
}
