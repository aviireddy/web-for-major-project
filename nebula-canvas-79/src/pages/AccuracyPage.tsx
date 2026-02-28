import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const AccuracyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attackResults, setAttackResults] = useState<any[]>([]);

  useEffect(() => {
    fetchAttackResults();
  }, [id]);

  const fetchAttackResults = async () => {
    const { data } = await supabase
      .from("attack_results")
      .select("*")
      .eq("project_id", id!)
      .order("created_at", { ascending: true });
    
    setAttackResults(data || []);
  };

  const pgdData = attackResults
    .filter(r => r.attack_type === 'PGD')
    .map((r, idx) => ({
      run: idx + 1,
      accuracy: (r.accuracy * 100).toFixed(2),
    }));

  const fgsmData = attackResults
    .filter(r => r.attack_type === 'FGSM')
    .map((r, idx) => ({
      run: idx + 1,
      accuracy: (r.accuracy * 100).toFixed(2),
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(`/project/${id}`)}
          className="mb-6 border-primary/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-glow-cyan bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Attack Accuracy Results
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card/50 border border-primary/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-glow-purple">PGD Attack</h2>
            {pgdData.length > 0 ? (
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pgdData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                    <XAxis 
                      dataKey="run" 
                      stroke="hsl(var(--foreground))"
                      label={{ value: 'Run Number', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No PGD attack results yet</p>
            )}
          </div>

          <div className="bg-card/50 border border-primary/30 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-glow-purple">FGSM Attack</h2>
            {fgsmData.length > 0 ? (
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--secondary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fgsmData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                    <XAxis 
                      dataKey="run" 
                      stroke="hsl(var(--foreground))"
                      label={{ value: 'Run Number', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--secondary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No FGSM attack results yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyPage;
