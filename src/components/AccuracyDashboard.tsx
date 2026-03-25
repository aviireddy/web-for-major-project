import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface AccuracyDashboardProps {
  trainingRuns: any[];
}

const COLORS = ["hsl(180, 100%, 50%)", "hsl(280, 100%, 60%)", "hsl(320, 100%, 60%)", "hsl(60, 100%, 50%)"];

export const AccuracyDashboard = ({ trainingRuns }: AccuracyDashboardProps) => {
  const barData = trainingRuns.map((run, idx) => ({
    name: `Run ${idx + 1}`,
    accuracy: Number(run.accuracy) * 100,
    loss: Number(run.loss || 0) * 100,
  }));

  const pieData = trainingRuns
    .reduce((acc: any[], run) => {
      const existing = acc.find((item) => item.name === run.attack_type);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: run.attack_type || "Standard", value: 1 });
      }
      return acc;
    }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="card-glow backdrop-blur-xl bg-card/80">
        <CardHeader>
          <CardTitle className="text-glow-cyan">Accuracy Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 80%, 40%)" />
              <XAxis dataKey="name" stroke="hsl(180, 100%, 95%)" />
              <YAxis stroke="hsl(180, 100%, 95%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 35%, 8%)",
                  border: "1px solid hsl(180, 80%, 40%)",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="hsl(180, 100%, 50%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-glow backdrop-blur-xl bg-card/80">
        <CardHeader>
          <CardTitle className="text-glow-purple">Accuracy vs Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 80%, 40%)" />
              <XAxis dataKey="name" stroke="hsl(180, 100%, 95%)" />
              <YAxis stroke="hsl(180, 100%, 95%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 35%, 8%)",
                  border: "1px solid hsl(180, 80%, 40%)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="accuracy" fill="hsl(180, 100%, 50%)" />
              <Bar dataKey="loss" fill="hsl(280, 100%, 60%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-glow backdrop-blur-xl bg-card/80">
        <CardHeader>
          <CardTitle className="text-glow-pink">Attack Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 35%, 8%)",
                  border: "1px solid hsl(180, 80%, 40%)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-glow backdrop-blur-xl bg-card/80">
        <CardHeader>
          <CardTitle className="text-glow-cyan">Latest Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {trainingRuns.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Latest Accuracy:</span>
                <span className="text-2xl font-bold text-primary">
                  {(Number(trainingRuns[0].accuracy) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Accuracy:</span>
                <span className="text-2xl font-bold text-secondary">
                  {(
                    trainingRuns.reduce((sum, run) => sum + Number(run.accuracy), 0) /
                    trainingRuns.length *
                    100
                  ).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Runs:</span>
                <span className="text-2xl font-bold text-accent">{trainingRuns.length}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No training data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
