import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const UserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (!profile) return null;

  return (
    <div className="flex items-center gap-4 card-glow px-4 py-3 rounded-lg backdrop-blur-xl bg-card/80">
      <Avatar className="border-2 border-primary animate-glow-pulse">
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{profile.username}</p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLogout}
        className="border-destructive/50 hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};
