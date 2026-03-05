import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";

interface ModelUploadProps {
  projectId: string;
  onModelUploaded: () => void;
}

export const ModelUpload = ({ projectId, onModelUploaded }: ModelUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [modelFile, setModelFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pt', '.zip'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Please upload a .pt or .zip file");
        return;
      }
      
      setModelFile(file);
    }
  };

  const handleUpload = async () => {
    if (!modelFile) return;

    setUploading(true);
    try {
      const filePath = `${projectId}/${Date.now()}-${modelFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-models')
        .upload(filePath, modelFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-models')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ model_url: publicUrl })
        .eq('id', projectId);

      if (updateError) throw updateError;

      toast.success("Model uploaded successfully!");
      onModelUploaded();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload model");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setModelFile(null);
  };

  return (
    <Card className="bg-card/50 border-primary/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-glow-purple">Upload Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pt,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary transition-colors">
              <Upload className="h-5 w-5" />
              <span>Select Model File (.pt or .zip)</span>
            </div>
          </label>

          {modelFile && (
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-primary" />
                <span className="text-sm">{modelFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {modelFile && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {uploading ? "Uploading..." : "Upload Model"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
