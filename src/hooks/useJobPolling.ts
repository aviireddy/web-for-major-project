import { useEffect, useState } from 'react';

interface PollingOptions {
  jobId: string | null;
  baseUrl: string;
  onCompleted?: (result: any) => void;
  onError?: (error: Error) => void;
  pollInterval?: number;
  timeout?: number;
}

interface JobStatus {
  job_id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message?: string;
}

interface JobResult {
  job_id: string;
  status: string;
  metrics?: any;
  evaluation?: any;
  [key: string]: any;
}

export const useJobPolling = ({
  jobId,
  baseUrl,
  onCompleted,
  onError,
  pollInterval = 3000,
  timeout = 30 * 60 * 1000, // 30 minutes
}: PollingOptions) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') {
      setIsPolling(false);
      return;
    }

    let aborted = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let elapsedIntervalId: ReturnType<typeof setInterval> | null = null;
    const controller = new AbortController();

    setIsPolling(true);
    setElapsed(0);

    // Track elapsed time
    elapsedIntervalId = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Set timeout
    timeoutId = setTimeout(() => {
      aborted = true;
      controller.abort();
      const timeoutError = new Error('Evaluation timeout after 30 minutes. Please check backend logs.');
      setError(timeoutError);
      setStatus('failed');
      setIsPolling(false);
      onError?.(timeoutError);
    }, timeout);

    const fetchWithRetry = async (url: string, retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } catch (err) {
          if (i === retries - 1) throw err;
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    };

    const pollStatus = async () => {
      if (aborted) return;

      try {
        const statusData: JobStatus = await fetchWithRetry(`${baseUrl}/status/${jobId}`);
        
        if (!statusData || typeof statusData.status !== 'string') {
          throw new Error('Invalid status response from server');
        }

        setStatus(statusData.status);

        if (statusData.status === 'completed') {
          // Fetch final results
          try {
            const resultData: JobResult = await fetchWithRetry(`${baseUrl}/result/${jobId}`);
            setResult(resultData);
            setStatus('completed');
            setIsPolling(false);
            onCompleted?.(resultData);
          } catch (resultError) {
            console.error('Error fetching results:', resultError);
            const err = resultError instanceof Error ? resultError : new Error('Failed to fetch results');
            setError(err);
            setStatus('failed');
            setIsPolling(false);
            onError?.(err);
          }
        } else if (statusData.status === 'failed') {
          const failError = new Error(statusData.message || 'Evaluation failed');
          setError(failError);
          setStatus('failed');
          setIsPolling(false);
          onError?.(failError);
        }
      } catch (err) {
        if (!aborted) {
          console.error('Polling error:', err);
          const pollError = err instanceof Error ? err : new Error('Network error during polling');
          setError(pollError);
          setStatus('failed');
          setIsPolling(false);
          onError?.(pollError);
        }
      }
    };

    // Start polling
    pollStatus(); // Initial poll
    intervalId = setInterval(pollStatus, pollInterval);

    // Cleanup
    return () => {
      aborted = true;
      controller.abort();
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (elapsedIntervalId) clearInterval(elapsedIntervalId);
      setIsPolling(false);
    };
  }, [jobId, baseUrl, onCompleted, onError, pollInterval, timeout, status]);

  return {
    status,
    result,
    error,
    isPolling,
    elapsed,
  };
};
