import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/project/${project.id}`)}
      className="cursor-pointer hover:scale-105 transition-all duration-300 card-glow backdrop-blur-xl bg-card/80 min-w-[300px]"
    >
      <CardHeader>
        <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 overflow-hidden">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🧠</span>
            </div>
          )}
        </div>
        <CardTitle className="text-glow-cyan">{project.name}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {project.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Created: {new Date(project.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};
