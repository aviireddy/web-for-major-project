import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  LogOut,
  Download,
  ArrowLeft,
  BarChart3,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EvaluationHistory {
  id: string;
  experimentName: string;
  cleanAccuracy: number;
  worstCaseRobust: number;
  date: string;
  attacks: string[];
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const [history, setHistory] = useState<EvaluationHistory[]>([
    {
      id: '1',
      experimentName: 'robustness_cifar10',
      cleanAccuracy: 0.823,
      worstCaseRobust: 0.456,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      attacks: ['FGSM', 'PGD'],
    },
    {
      id: '2',
      experimentName: 'baseline_mnist',
      cleanAccuracy: 0.91,
      worstCaseRobust: 0.567,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      attacks: ['FGSM'],
    },
    {
      id: '3',
      experimentName: 'improved_resnet',
      cleanAccuracy: 0.856,
      worstCaseRobust: 0.512,
      date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      attacks: ['FGSM', 'PGD', 'C&W'],
    },
  ]);

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const stats = {
    totalEvaluations: history.length,
    avgCleanAcc: (history.reduce((sum, h) => sum + h.cleanAccuracy, 0) / history.length * 100).toFixed(2),
    avgRobust: (history.reduce((sum, h) => sum + h.worstCaseRobust, 0) / history.length * 100).toFixed(2),
    bestModel: history.reduce((best, h) => (h.worstCaseRobust > best.worstCaseRobust ? h : best)).experimentName,
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const downloadAllResults = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_evaluations_${userId}.json`;
    a.click();
    toast.success('All results downloaded');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate('/evaluation')}
            variant="outline"
            className="border-white/30 text-gray-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Evaluation
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
          <div className="p-8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-5xl font-bold text-white mb-2">👋 Welcome, {userId}!</h1>
                <p className="text-gray-300">Your adversarial robustness evaluation profile</p>
              </div>
              <div className="text-right">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-500/20 backdrop-blur-xl border-blue-400/30">
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Evaluations
              </p>
              <p className="text-4xl font-bold text-blue-300">{stats.totalEvaluations}</p>
            </div>
          </Card>

          <Card className="bg-green-500/20 backdrop-blur-xl border-green-400/30">
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-2">Avg Clean Accuracy</p>
              <p className="text-4xl font-bold text-green-300">{stats.avgCleanAcc}%</p>
            </div>
          </Card>

          <Card className="bg-purple-500/20 backdrop-blur-xl border-purple-400/30">
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-2">Avg Robustness</p>
              <p className="text-4xl font-bold text-purple-300">{stats.avgRobust}%</p>
            </div>
          </Card>

          <Card className="bg-orange-500/20 backdrop-blur-xl border-orange-400/30">
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-2">Best Model</p>
              <p className="text-lg font-bold text-orange-300 truncate">{stats.bestModel}</p>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evaluation History */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Evaluation History</h2>
                <div className="space-y-3">
                  {history.map((evalItem) => (
                    <div
                      key={evalItem.id}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{evalItem.experimentName}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(evalItem.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {evalItem.attacks.join(', ')}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            toast.success('Loading evaluation details...')
                          }
                          variant="outline"
                          className="border-white/30 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          View
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded bg-blue-500/20 border border-blue-400/30">
                          <p className="text-xs text-gray-400">Clean Accuracy</p>
                          <p className="text-lg font-bold text-blue-300">
                            {(evalItem.cleanAccuracy * 100).toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-2 rounded bg-orange-500/20 border border-orange-400/30">
                          <p className="text-xs text-gray-400">Robustness</p>
                          <p className="text-lg font-bold text-orange-300">
                            {(evalItem.worstCaseRobust * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Section */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Account Settings</h3>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Email</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-300">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">User ID</label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs font-mono text-gray-400 break-all">{userId}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2">
                  Update Password
                </Button>
              </div>
            </Card>

            {/* Actions */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <Button
                  onClick={downloadAllResults}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Results
                </Button>
                <Button
                  onClick={() => navigate('/evaluation')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  New Evaluation
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Most Used Attack</span>
                    <span className="text-white font-semibold">FGSM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Models Evaluated</span>
                    <span className="text-white font-semibold">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white font-semibold">Today</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
