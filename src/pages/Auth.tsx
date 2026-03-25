import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FloatingBackground } from "@/components/FloatingBackground";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <FloatingBackground />
      <div className="relative z-10 w-full px-4">
        <div className="mb-8 text-center">
          <h1 className="text-6xl font-bold mb-2 text-glow-cyan bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Neural Vision
          </h1>
          <p className="text-xl text-muted-foreground">AI-Powered CNN Training Platform</p>
        </div>
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;
