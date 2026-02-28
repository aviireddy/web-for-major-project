import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { FileUploadZone, FormField, ToggleAttack, ValidationError } from '@/components/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { startEvaluation } from '@/lib/api';
import { Play, AlertCircle, FolderOpen, Code, Zap } from 'lucide-react';

interface Attacks {
  fgsm: boolean;
  pgd: boolean;
  cw: boolean;
  jsma: boolean;
  deepfool: boolean;
}

const EvaluationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // Get userId from context or localStorage
  const userId = user?.userId || localStorage.getItem('userId') || 'user1';

  // Form state
  const [expName, setExpName] = useState('');

  // File uploads
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [weightsFile, setWeightsFile] = useState<File | null>(null);

  // Attacks
  const [attacks, setAttacks] = useState<Attacks>({
    fgsm: true,
    pgd: false,
    cw: false,
    jsma: false,
    deepfool: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!expName.trim()) {
      newErrors.push('Experiment name is required');
    }

    if (!Object.values(attacks).some((v) => v)) {
      newErrors.push('Select at least one attack method');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors([]);
    return true;
  };

  const handleStartEvaluation = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    console.log('Starting evaluation with attacks:', attacks);

    try {
      console.log('Calling API...');
      const data = await startEvaluation({
        experiment_name: expName,
        device: 'auto',
        dataset: {
          name: 'cifar10',
          root: './data/cifar',
          batch_size: 32,
          num_workers: 2,
        },
        model: {
          architecture: 'resnet50',
          pretrained: true,
          weights_path: null,
          num_classes: 10,
          input_size: [3, 32, 32],
        },
        attacks: {
          fgsm: { enabled: attacks.fgsm, eps: 0.03 },
          pgd: { enabled: attacks.pgd, eps: 0.03, alpha: 0.007, steps: 10 },
          cw: { enabled: attacks.cw, c: 0.001, kappa: 0.0, steps: 200, lr: 0.01 },
          jsma: { enabled: attacks.jsma },
          deepfool: { enabled: attacks.deepfool },
        },
        evaluation: {
          results_dir: `./experiments/${userId}/${expName}`,
        },
      });
      
      console.log('API Response:', data);
      localStorage.setItem('currentJobId', data.job_id);
      localStorage.setItem('currentExpName', expName);

      toast.success('Evaluation started!');
      console.log('Navigating to:', `/live/${data.job_id}`);
      navigate(`/live/${data.job_id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start evaluation';
      console.error('Evaluation error:', err);
      toast.error(errorMessage);
      toast.error('Check browser console for details');
    } finally {
      setLoading(false);
    }
  };

  const resultPath = `./experiments/${userId}/${expName || '[experiment]'}/`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Adversarial Evaluation Setup
          </h1>
          <p className="text-xl text-gray-300">Configure your robustness evaluation</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Section */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-400" />
                  User Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    label="Experiment Name *"
                    value={expName}
                    onChange={(v) => setExpName(v as string)}
                    placeholder="my-robustness-test"
                    hint="Unique name for this evaluation"
                  />
                </div>
              </div>
            </Card>

            {/* Dataset Section */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                  Dataset Upload
                </h2>
                <div className="space-y-4">
                  <FileUploadZone
                    label="Dataset File/Folder"
                    description="Upload .zip, .csv, images, or NPZ file containing your dataset"
                    onFileSelect={setDatasetFile}
                    selectedFile={datasetFile}
                    accept=".zip,.csv,.npz,.tar,.tar.gz,image/*"
                  />
                </div>
              </div>
            </Card>

            {/* Model Section */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Code className="h-6 w-6 text-blue-400" />
                  Model Upload
                </h2>
                <div className="space-y-4">
                  <FileUploadZone
                    label="Model Architecture"
                    description="Upload Python file containing your model architecture (.py)"
                    onFileSelect={setModelFile}
                    selectedFile={modelFile}
                    accept=".py"
                  />
                  <FileUploadZone
                    label="Pretrained Weights"
                    description="Upload model weights (.pth, .pt, or .ckpt)"
                    onFileSelect={setWeightsFile}
                    selectedFile={weightsFile}
                    accept=".pth,.pt,.ckpt"
                  />
                </div>
              </div>
            </Card>

            {/* Attacks Section */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-400" />
                  Attack Methods *
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <ToggleAttack
                    name="fgsm"
                    label="FGSM (Fast Gradient Sign Method)"
                    enabled={attacks.fgsm}
                    onChange={(e) => setAttacks({ ...attacks, fgsm: e })}
                  />
                  <ToggleAttack
                    name="pgd"
                    label="PGD (Projected Gradient Descent)"
                    enabled={attacks.pgd}
                    onChange={(e) => setAttacks({ ...attacks, pgd: e })}
                  />
                  <ToggleAttack
                    name="cw"
                    label="C&W (Carlini & Wagner)"
                    enabled={attacks.cw}
                    onChange={(e) => setAttacks({ ...attacks, cw: e })}
                  />
                  <ToggleAttack
                    name="jsma"
                    label="JSMA (Jacobian Saliency Map Attack)"
                    enabled={attacks.jsma}
                    onChange={(e) => setAttacks({ ...attacks, jsma: e })}
                  />
                  <ToggleAttack
                    name="deepfool"
                    label="DeepFool"
                    enabled={attacks.deepfool}
                    onChange={(e) => setAttacks({ ...attacks, deepfool: e })}
                  />
                </div>
              </div>
            </Card>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((error, idx) => (
                  <ValidationError key={idx} message={error} />
                ))}
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStartEvaluation}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 text-lg rounded-2xl shadow-xl disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Starting Evaluation...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Evaluation
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Upload Summary</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                    <p className="text-xs text-gray-400">Dataset</p>
                    <p className="text-sm font-semibold text-blue-300">
                      {datasetFile ? datasetFile.name : 'Not uploaded'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                    <p className="text-xs text-gray-400">Model Architecture</p>
                    <p className="text-sm font-semibold text-indigo-300">
                      {modelFile ? modelFile.name : 'Not uploaded'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-400/30">
                    <p className="text-xs text-gray-400">Weights</p>
                    <p className="text-sm font-semibold text-purple-300">
                      {weightsFile ? weightsFile.name : 'Not uploaded'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Results Location</h3>
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/50 overflow-auto">
                  <p className="text-xs text-gray-300 font-mono break-all">
                    {resultPath}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Results will be saved to this directory after evaluation completes
                </p>
              </div>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Attacks Selected</h3>
                <div className="space-y-2">
                  {Object.entries(attacks).map(([attack, enabled]) => (
                    <div key={attack} className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          enabled ? 'bg-green-400' : 'bg-gray-500'
                        }`}
                      />
                      <p className={`text-sm ${enabled ? 'text-white' : 'text-gray-500'}`}>
                        {attack.toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationSetupPage;
