import { useState, useEffect, useRef } from "react";
import { useJobPolling } from "@/hooks/useJobPolling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Shield, 
  Play, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Loader2,
  Activity
} from "lucide-react";

const BASE_URL = "http://localhost:8000";
const STORAGE_KEY = "adversarial_eval_job";

interface EvaluationConfig {
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
    input_size: number[];
  };
  attacks: {
    fgsm: { enabled: boolean; eps: number };
    pgd: { enabled: boolean; eps?: number; alpha?: number; steps?: number };
    cw: { enabled: boolean; c?: number; kappa?: number; steps?: number };
    jsma: { enabled: boolean; theta?: number; gamma?: number };
    deepfool: { enabled: boolean; overshoot?: number; max_iter?: number };
  };
  evaluation: {
    results_dir: string;
  };
}

interface MetricsData {
  clean_accuracy?: number;
  adv_accuracy?: number;
  attack_success_rate?: number;
  total?: number;
  [key: string]: any;
}

const AdversarialDashboard = () => {
  // State management
  const [jobId, setJobId] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userid, setUserid] = useState("user1");
  const [expName, setExpName] = useState("");
  const [dataset, setDataset] = useState("cifar10");
  const [architecture, setArchitecture] = useState("resnet50");
  const [attacks, setAttacks] = useState({
    fgsm: true,
    pgd: false,
    cw: false,
    jsma: false,
    deepfool: false,
  });

  const startTimeRef = useRef<number>(0);

  // Custom polling hook
  const { status, result, error: pollingError, isPolling, elapsed } = useJobPolling({
    jobId,
    baseUrl: BASE_URL,
    onCompleted: (result) => {
      console.log("Evaluation completed:", result);
      setMetrics(result.metrics || result);
      setLoading(false);
      toast.success("Evaluation completed successfully!");
      localStorage.removeItem(STORAGE_KEY);
    },
    onError: (error) => {
      console.error("Polling error:", error);
      setError(error.message);
      setLoading(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  // Health check on mount
  useEffect(() => {
    checkHealth();
    
    // Resume from localStorage if exists
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (savedJobId) {
      setJobId(savedJobId);
      setLoading(true);
      toast.info("Resuming previous evaluation...");
    }
  }, []);

  // Update error state from polling
  useEffect(() => {
    if (pollingError) {
      setError(pollingError.message);
    }
  }, [pollingError]);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data.status === 'ok' ? 'ok' : 'error');
      } else {
        setHealthStatus('error');
      }
    } catch (err) {
      console.error("Health check failed:", err);
      setHealthStatus('error');
      toast.error("Backend is not responding. Please ensure the FastAPI server is running on port 8000.");
    }
  };

  const handleStartEvaluation = async () => {
    if (!expName.trim()) {
      toast.error("Please enter an experiment name");
      return;
    }

    if (!Object.values(attacks).some((v) => v)) {
      toast.error("Please enable at least one attack");
      return;
    }

    const datasetRoot = dataset === "mnist"
      ? "./data/mnist"
      : dataset === "tiny-imagenet"
        ? "./data/tiny-imagenet-200"
        : "./data/cifar";
    const inputSize = dataset === "tiny-imagenet" ? [3, 224, 224] : [3, 32, 32];
    const numClasses = dataset === "tiny-imagenet" ? 200 : dataset === "mnist" ? 10 : 10;

    const config: EvaluationConfig = {
      experiment_name: expName,
      device: "auto",
      dataset: {
        name: dataset,
        root: datasetRoot,
        batch_size: 32,
        num_workers: 2,
      },
      model: {
        architecture,
        pretrained: true,
        weights_path: null,
        num_classes: numClasses,
        input_size: inputSize,
      },
      attacks: {
        fgsm: { enabled: attacks.fgsm, eps: 0.03 },
        pgd: { enabled: attacks.pgd, eps: 0.03, alpha: 0.007, steps: 10 },
        cw: { enabled: attacks.cw, c: 1.0, kappa: 0, steps: 100 },
        jsma: { enabled: attacks.jsma, theta: 1.0, gamma: 0.1 },
        deepfool: { enabled: attacks.deepfool, overshoot: 0.02, max_iter: 50 },
      },
      evaluation: {
        results_dir: `./experiments/${userid}/${expName}/`,
      },
    };

    try {
      setLoading(true);
      setError(null);
      setMetrics(null);
      startTimeRef.current = Date.now();

      const response = await fetch(`${BASE_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.job_id) {
        throw new Error("No job_id returned from server");
      }

      setJobId(data.job_id);
      localStorage.setItem(STORAGE_KEY, data.job_id);
      toast.success("Evaluation started!");
    } catch (err) {
      console.error("Start evaluation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start evaluation";
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setJobId(null);
    setLoading(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Evaluation cancelled");
  };

  const handleReset = () => {
    setJobId(null);
    setLoading(false);
    setError(null);
    setMetrics(null);
    setExpName("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportCSV = () => {
    if (!metrics) return;

    const rows = [
      ["Metric", "Value"],
      ["Clean Accuracy", metrics.clean_accuracy?.toFixed(4) || "N/A"],
    ];

    if (metrics.adv_accuracy !== undefined) {
      rows.push(["Adversarial Accuracy", metrics.adv_accuracy.toFixed(4)]);
    }

    if (metrics.attack_success_rate !== undefined) {
      rows.push(["Attack Success Rate", metrics.attack_success_rate.toFixed(4)]);
    }

    if (metrics.total !== undefined) {
      rows.push(["Total Samples", metrics.total.toString()]);
    }

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${expName}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as CSV");
  };

  const exportJSON = () => {
    if (!metrics) return;

    const json = JSON.stringify(metrics, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${expName}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as JSON");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Adversarial Evaluation Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Test your models against adversarial attacks
          </p>
        </div>

        {/* Health Status Badge */}
        <div className="flex justify-center mb-6">
          <Badge
            variant={healthStatus === 'ok' ? 'default' : 'destructive'}
            className="text-base px-4 py-2"
          >
            {healthStatus === 'checking' && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Backend...
              </>
            )}
            {healthStatus === 'ok' && (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Backend Ready
              </>
            )}
            {healthStatus === 'error' && (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Backend Offline
              </>
            )}
          </Badge>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Evaluation Configuration
            </CardTitle>
            <CardDescription>
              Configure your adversarial robustness evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* IDLE STATE - Form */}
            {!loading && !metrics && !error && (
              <div className="space-y-6">
                {/* Basic Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userid">User ID</Label>
                    <Input
                      id="userid"
                      value={userid}
                      onChange={(e) => setUserid(e.target.value)}
                      placeholder="user1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expName">Experiment Name *</Label>
                    <Input
                      id="expName"
                      value={expName}
                      onChange={(e) => setExpName(e.target.value)}
                      placeholder="my_experiment"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataset">Dataset</Label>
                    <Select value={dataset} onValueChange={setDataset}>
                      <SelectTrigger id="dataset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cifar10">CIFAR-10</SelectItem>
                        <SelectItem value="mnist">MNIST</SelectItem>
                        <SelectItem value="tiny-imagenet">Tiny ImageNet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="architecture">Model Architecture</Label>
                    <Select value={architecture} onValueChange={setArchitecture}>
                      <SelectTrigger id="architecture">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resnet50">ResNet-50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Attack Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Attack Methods</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(attacks).map(([attack, enabled]) => (
                      <div
                        key={attack}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Label
                          htmlFor={attack}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {attack.toUpperCase()}
                        </Label>
                        <Switch
                          id={attack}
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            setAttacks((prev) => ({ ...prev, [attack]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleStartEvaluation}
                  disabled={healthStatus !== 'ok' || !expName.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Evaluation
                </Button>
              </div>
            )}

            {/* RUNNING STATE - Spinner */}
            {loading && !metrics && (
              <div className="space-y-6 text-center py-8">
                <div className="flex justify-center">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="h-8 w-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Evaluation in Progress
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Evaluating {expName}... {formatTime(elapsed)}
                  </p>
                  <Badge variant="outline" className="text-sm">
                    Status: {status}
                  </Badge>
                </div>

                <Progress value={undefined} className="w-full h-2" />

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📊 Running adversarial attacks...</p>
                  <p>⚡ This may take several minutes</p>
                  <p>🔄 Job ID: {jobId}</p>
                </div>

                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  className="mt-4"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Evaluation
                </Button>
              </div>
            )}

            {/* COMPLETED STATE - Results */}
            {metrics && status === 'completed' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                  <h3 className="text-2xl font-bold">Evaluation Complete!</h3>
                </div>

                {/* Metrics Table */}
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold">Metric</th>
                        <th className="text-right p-4 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {metrics.clean_accuracy !== undefined && (
                        <tr className="hover:bg-muted/50">
                          <td className="p-4">Clean Accuracy</td>
                          <td className="p-4 text-right font-mono font-bold text-green-600">
                            {(metrics.clean_accuracy * 100).toFixed(2)}%
                          </td>
                        </tr>
                      )}

                      {metrics.adv_accuracy !== undefined && (
                        <tr className="hover:bg-muted/50">
                          <td className="p-4">Adversarial Accuracy</td>
                          <td className="p-4 text-right font-mono font-bold text-blue-600">
                            {(metrics.adv_accuracy * 100).toFixed(2)}%
                          </td>
                        </tr>
                      )}

                      {metrics.attack_success_rate !== undefined && (
                        <tr className="hover:bg-muted/50">
                          <td className="p-4">Attack Success Rate</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600">
                            {(metrics.attack_success_rate * 100).toFixed(2)}%
                          </td>
                        </tr>
                      )}

                      {metrics.total !== undefined && (
                        <tr className="hover:bg-muted/50 bg-orange-50 dark:bg-orange-950/20">
                          <td className="p-4 font-semibold">Total Samples</td>
                          <td className="p-4 text-right font-mono font-bold text-orange-600">
                            {metrics.total}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={exportCSV}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={exportJSON}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={handleReset}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    New Evaluation
                  </Button>
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {error && (status === 'failed' || !loading) && (
              <div className="space-y-4 text-center py-8">
                <div className="flex justify-center">
                  <AlertCircle className="h-16 w-16 text-red-500" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-red-600 mb-2">
                    Evaluation Failed
                  </h3>
                  <p className="text-muted-foreground bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleReset} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={checkHealth} variant="outline">
                    <Activity className="mr-2 h-4 w-4" />
                    Check Backend
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Results stored in: ./experiments/{userid}/{expName || "[experiment]"}/</p>
          <p className="mt-2">Backend API: {BASE_URL}</p>
        </div>
      </div>
    </div>
  );
};

export default AdversarialDashboard;
