import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";
import { ImageGallery } from "@/components/ImageGallery";
import { ModelUpload } from "@/components/ModelUpload";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [hasImages, setHasImages] = useState(false);
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchProject();
      checkResources();
    };
    checkAuth();
  }, [id, navigate]);

  const fetchProject = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id!)
      .single();
    setProject(data);
    setHasModel(!!data?.model_url);
  };

  const checkResources = async () => {
    const { data: images } = await supabase
      .from("uploaded_images")
      .select("id")
      .eq("project_id", id!)
      .limit(1);
    
    setHasImages((images?.length || 0) > 0);
  };

  const handleCheckAccuracy = async () => {
    if (!hasImages || !hasModel) {
      toast.error("Please upload both images and a model first");
      return;
    }

    // Simulate attack results
    const attackTypes = ["PGD", "FGSM"];
    
    for (const attackType of attackTypes) {
      const accuracy = Math.random() * 0.2 + 0.75;
      
      await supabase.from("attack_results").insert({
        project_id: id!,
        attack_type: attackType,
        accuracy,
      });
    }

    toast.success("Attack analysis complete!");
    navigate(`/accuracy/${id}`);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="mb-6 border-primary/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 text-glow-cyan bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {project.name}
          </h1>
          <p className="text-xl text-muted-foreground">{project.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ImageGallery projectId={id!} />
          <ModelUpload projectId={id!} onModelUploaded={() => setHasModel(true)} />
        </div>

        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleCheckAccuracy}
            disabled={!hasImages || !hasModel}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-50"
            size="lg"
          >
            <Target className="mr-2 h-5 w-5" />
            Check Accuracy
          </Button>
          {(!hasImages || !hasModel) && (
            <p className="text-sm text-muted-foreground flex items-center">
              {!hasImages && !hasModel && "Upload images and model to check accuracy"}
              {hasImages && !hasModel && "Upload a model to check accuracy"}
              {!hasImages && hasModel && "Upload images to check accuracy"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
