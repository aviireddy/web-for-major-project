import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, Lock } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required');
      }

      const userId = 'user_' + Math.random().toString(36).substr(2, 9);
      const token = 'demo_token_' + Date.now();
      login(userId, email, token);

      toast.success('Registration successful!');
      navigate('/evaluation');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/10">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justifycenter mb-4">
                <Shield className="h-16 w-16 text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Create Account
              </h1>
              <p className="text-gray-300">Register to start evaluations</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-400 focus:bg-white/30 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-400 focus:bg-white/30 focus:border-blue-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 text-lg rounded-xl shadow-xl disabled:opacity-50 transition-all"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-blue-300 hover:text-blue-200 transition"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
