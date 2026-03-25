import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { getResult, getStatus } from '@/lib/api';
import {
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  RotateCw,
  Image,
} from 'lucide-react';

interface Metrics {
  clean_accuracy: number;
  adv_accuracy: number;
  attack_success_rate: number;
  total: number;
  per_attack?: {
    [key: string]: {
      adv_accuracy: number;
      attack_success_rate: number;
    };
  };
}

const LiveEvaluationPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const chartRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const expName = localStorage.getItem('currentExpName') || 'evaluation';

  // Polling hook
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let elapsedInterval: NodeJS.Timeout | null = null;

    const poll = async () => {
      try {
        if (!jobId) {
          setStatus('failed');
          setError('Missing job id.');
          setLoading(false);
          return;
        }

        const statusData = await getStatus(jobId);
        setStatus(statusData.status);

        if (statusData.status === 'completed') {
          const resultData = await getResult(jobId);
          if (resultData.status === 'completed') {
            setMetrics(resultData.metrics as Metrics);
          } else if (resultData.status === 'failed') {
            setError(resultData.error || 'Evaluation failed.');
            setStatus('failed');
          }
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
          if (elapsedInterval) clearInterval(elapsedInterval);
          return;
        }

        if (statusData.status === 'failed') {
          const resultData = await getResult(jobId);
          if (resultData.status === 'failed') {
            setError(resultData.error || 'Evaluation failed.');
          } else {
            setError('Evaluation failed.');
          }
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
          if (elapsedInterval) clearInterval(elapsedInterval);
        }
      } catch (err) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setLoading(false);
      }
    };

    poll();
    pollInterval = setInterval(poll, 3000);
    elapsedInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (elapsedInterval) clearInterval(elapsedInterval);
    };
  }, [jobId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Prepare chart data
  const accuracyData = metrics
    ? [
        { name: 'Clean Accuracy', value: Number((metrics.clean_accuracy * 100).toFixed(2)) },
        { name: 'Adversarial Accuracy', value: Number((metrics.adv_accuracy * 100).toFixed(2)) },
        { name: 'Attack Success Rate', value: Number((metrics.attack_success_rate * 100).toFixed(2)) },
      ]
    : [];

  const pieData = metrics
    ? [
        { name: 'Robust', value: metrics.adv_accuracy * 100 },
        { name: 'Vulnerable', value: (1 - metrics.adv_accuracy) * 100 },
      ]
    : [];

  const COLORS = ['#10b981', '#ef4444'];

  // Export chart as PNG
  const exportChartAsPNG = async () => {
    if (!chartRef.current) {
      toast.error('Chart not found');
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${expName}_chart.png`;
      link.click();
      toast.success('Chart exported as PNG');
    } catch (err) {
      toast.error('Failed to export chart');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Live Evaluation Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Experiment: <strong>{expName}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400">{formatTime(elapsed)}</div>
            <p className="text-gray-400">Elapsed time</p>
          </div>
        </div>

        {/* Status Section */}
        {loading && status === 'running' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
            <div className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="h-24 w-24 animate-spin text-blue-400" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 bg-blue-400/30 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white">Evaluation in Progress</h2>
              <p className="text-xl text-gray-300">
                Testing your model against adversarial attacks...
              </p>
              <div className="w-full bg-gray-700/50 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse"
                  style={{ width: `${Math.min(elapsed * 2, 90)}%` }}
                ></div>
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {status === 'failed' && !loading && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30 mb-8">
            <div className="p-8 space-y-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Evaluation Failed</h2>
                  <p className="text-gray-300 mt-2">{error || 'An error occurred during evaluation'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/evaluation')}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Results Section */}
        {metrics && status === 'completed' && (
          <>
            {/* Success Badge */}
            <Card className="bg-emerald-500/10 backdrop-blur-xl border-emerald-500/30 mb-8">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Evaluation Complete!</h3>
                    <p className="text-emerald-300">All attacks completed successfully</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Time</p>
                  <p className="text-2xl font-bold text-white">{formatTime(elapsed)}</p>
                </div>
              </div>
            </Card>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-blue-500/20 backdrop-blur-xl border-blue-400/30">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Clean Accuracy</p>
                  <p className="text-4xl font-bold text-blue-300">
                    {(metrics.clean_accuracy * 100).toFixed(2)}%
                  </p>
                </div>
              </Card>

              <Card className="bg-green-500/20 backdrop-blur-xl border-green-400/30">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Adversarial Accuracy</p>
                  <p className="text-4xl font-bold text-green-300">
                    {(metrics.adv_accuracy * 100).toFixed(2)}%
                  </p>
                </div>
              </Card>

              <Card className="bg-orange-500/20 backdrop-blur-xl border-orange-400/30">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Attack Success Rate</p>
                  <p className="text-4xl font-bold text-orange-300">
                    {(metrics.attack_success_rate * 100).toFixed(2)}%
                  </p>
                </div>
              </Card>

              <Card className="bg-red-500/20 backdrop-blur-xl border-red-400/30">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Total Samples</p>
                  <p className="text-4xl font-bold text-red-300">
                    {metrics.total}
                  </p>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="mb-8 space-y-6">
              {/* Per-Attack Comparison - NEW */}
              {metrics.per_attack && Object.keys(metrics.per_attack).length > 0 && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Attack Comparison</h3>
                      <p className="text-sm text-gray-400">
                        Compare the effectiveness of each adversarial attack
                      </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-{Object.keys(metrics.per_attack).length > 2 ? '3' : '2'} gap-6">
                      {Object.entries(metrics.per_attack).map(([attackName, attackMetrics]) => {
                        const attackData = [
                          { name: 'Clean', accuracy: Number((metrics.clean_accuracy * 100).toFixed(2)) },
                          { name: 'Adversarial', accuracy: Number((attackMetrics.adv_accuracy * 100).toFixed(2)) },
                          { name: 'Attack Success', rate: Number((attackMetrics.attack_success_rate * 100).toFixed(2)) },
                        ];
                        
                        const colorMap: {[key: string]: string} = {
                          fgsm: '#3b82f6',
                          pgd: '#ef4444',
                          cw: '#f59e0b',
                          jsma: '#8b5cf6',
                          deepfool: '#ec4899'
                        };
                        
                        const attackColor = colorMap[attackName.toLowerCase()] || '#10b981';
                        
                        return (
                          <Card key={attackName} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-white/10">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                                  {attackName}
                                </h4>
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: attackColor }}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-emerald-500/10 rounded-lg p-2">
                                  <div className="text-gray-400 text-xs">Clean Acc</div>
                                  <div className="text-emerald-300 font-bold text-lg">
                                    {(metrics.clean_accuracy * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-blue-500/10 rounded-lg p-2">
                                  <div className="text-gray-400 text-xs">Adv Acc</div>
                                  <div className="text-blue-300 font-bold text-lg">
                                    {(attackMetrics.adv_accuracy * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-orange-500/10 rounded-lg p-2">
                                <div className="text-gray-400 text-xs mb-1">Attack Success Rate</div>
                                <div className="text-orange-300 font-bold text-2xl">
                                  {(attackMetrics.attack_success_rate * 100).toFixed(1)}%
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2 mt-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${attackMetrics.attack_success_rate * 100}%`,
                                      backgroundColor: attackColor
                                    }}
                                  />
                                </div>
                              </div>
                              
                              <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={attackData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis 
                                    dataKey="name" 
                                    stroke="rgba(255,255,255,0.3)" 
                                    tick={{ fontSize: 10 }}
                                  />
                                  <YAxis 
                                    stroke="rgba(255,255,255,0.3)" 
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10 }}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#1f2937',
                                      border: 'none',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      fontSize: '12px'
                                    }}
                                  />
                                  <Bar dataKey="accuracy" fill={attackColor} />
                                  <Bar dataKey="rate" fill={attackColor} opacity={0.7} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* Comprehensive Attack Chart */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20" ref={chartRef}>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Adversarial Robustness Overview</h3>
                    <p className="text-sm text-gray-400">
                      Adversarial accuracy: <span className="text-orange-300 font-semibold">{(metrics.adv_accuracy * 100).toFixed(2)}%</span>
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#10b981" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Two-Column Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attack Comparison */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Accuracy Summary</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={accuracyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Pie Chart */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Robustness Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Detailed Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-sm font-semibold text-gray-300">Metric</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-300">Value</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-300">Complement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-white">Clean Accuracy</td>
                        <td className="px-4 py-3 text-green-300">
                          {(metrics.clean_accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-red-300">
                          {((1 - metrics.clean_accuracy) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-white">Adversarial Accuracy</td>
                        <td className="px-4 py-3 text-green-300">
                          {(metrics.adv_accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-red-300">
                          {((1 - metrics.adv_accuracy) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-white">Attack Success Rate</td>
                        <td className="px-4 py-3 text-green-300">
                          {(metrics.attack_success_rate * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-red-300">
                          {((1 - metrics.attack_success_rate) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      {/* Per-Attack Metrics */}
                      {metrics.per_attack && Object.keys(metrics.per_attack).length > 0 && (
                        <>
                          <tr className="bg-white/5">
                            <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                              Per-Attack Breakdown
                            </td>
                          </tr>
                          {Object.entries(metrics.per_attack).map(([attackName, attackMetrics]) => (
                            <React.Fragment key={attackName}>
                              <tr className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-3 text-white pl-8">
                                  → {attackName.toUpperCase()} Adv Accuracy
                                </td>
                                <td className="px-4 py-3 text-blue-300">
                                  {(attackMetrics.adv_accuracy * 100).toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 text-orange-300">
                                  {((1 - attackMetrics.adv_accuracy) * 100).toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-3 text-white pl-8">
                                  → {attackName.toUpperCase()} Attack Success
                                </td>
                                <td className="px-4 py-3 text-orange-300">
                                  {(attackMetrics.attack_success_rate * 100).toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 text-green-300">
                                  {((1 - attackMetrics.attack_success_rate) * 100).toFixed(2)}%
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={exportChartAsPNG}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3"
              >
                <Image className="h-4 w-4 mr-2" />
                Export Chart PNG
              </Button>

              <Button
                onClick={() => {
                  let csv = `Metric,Value\nClean Accuracy,${(metrics.clean_accuracy * 100).toFixed(2)}%\nAdversarial Accuracy (Overall),${(metrics.adv_accuracy * 100).toFixed(2)}%\nAttack Success Rate (Overall),${(metrics.attack_success_rate * 100).toFixed(2)}%\n`;
                  
                  // Add per-attack metrics
                  if (metrics.per_attack) {
                    csv += '\n--- Per-Attack Metrics ---\n';
                    Object.entries(metrics.per_attack).forEach(([attackName, attackMetrics]) => {
                      csv += `${attackName.toUpperCase()} Adv Accuracy,${(attackMetrics.adv_accuracy * 100).toFixed(2)}%\n`;
                      csv += `${attackName.toUpperCase()} Attack Success,${(attackMetrics.attack_success_rate * 100).toFixed(2)}%\n`;
                    });
                  }
                  
                  csv += `\nTotal Samples,${metrics.total}`;
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${expName}_results.csv`;
                  a.click();
                  toast.success('Results exported as CSV');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Button
                onClick={() => {
                  const json = JSON.stringify(metrics, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${expName}_results.json`;
                  a.click();
                  toast.success('Results exported as JSON');
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>

              <Button
                onClick={() => navigate(`/profile/${user?.userId || 'user1'}`)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3"
              >
                View Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveEvaluationPage;
