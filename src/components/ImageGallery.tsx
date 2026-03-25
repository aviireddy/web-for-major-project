import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageGalleryProps {
  projectId: string;
}

const DATASETS = ['CIFAR-10', 'MNIST', 'ImageNet'] as const;

export const ImageGallery = ({ projectId }: ImageGalleryProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<Record<string, boolean>>({
    'CIFAR-10': false,
    'MNIST': false,
    'ImageNet': false,
  });

  useEffect(() => {
    fetchImages();
    fetchDatasets();
  }, [projectId]);

  const fetchImages = async () => {
    const { data } = await supabase
      .from("uploaded_images")
      .select("*")
      .eq("project_id", projectId);
    setImages(data || []);
  };

  const fetchDatasets = async () => {
    const { data } = await supabase
      .from("projects")
      .select("selected_datasets")
      .eq("id", projectId)
      .single();
    
    if (data?.selected_datasets) {
      const datasets = data.selected_datasets.reduce((acc: Record<string, boolean>, ds: string) => {
        acc[ds] = true;
        return acc;
      }, {});
      setSelectedDatasets(prev => ({ ...prev, ...datasets }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `${projectId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath);

        await supabase.from("uploaded_images").insert({
          project_id: projectId,
          image_url: publicUrl,
          category: "User Upload",
        });
      }
      
      toast.success(`${files.length} image(s) uploaded successfully!`);
      fetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleDatasetToggle = async (dataset: string) => {
    const newValue = !selectedDatasets[dataset];
    setSelectedDatasets(prev => ({ ...prev, [dataset]: newValue }));

    const updatedDatasets = Object.entries({ ...selectedDatasets, [dataset]: newValue })
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    await supabase
      .from("projects")
      .update({ selected_datasets: updatedDatasets })
      .eq("id", projectId);

    toast.success(`${dataset} ${newValue ? 'enabled' : 'disabled'}`);
  };

  const removeImage = async (id: string) => {
    const { error } = await supabase.from("uploaded_images").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove image");
    } else {
      toast.success("Image removed");
      fetchImages();
    }
  };

  return (
    <Card className="bg-card/50 border-primary/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-glow-purple">Uploaded Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary transition-colors">
              <Upload className="h-5 w-5" />
              <span>{uploading ? "Uploading..." : "Upload Images from Computer"}</span>
            </div>
          </label>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Select Datasets:</h3>
            {DATASETS.map((dataset) => (
              <div key={dataset} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20">
                <Label htmlFor={dataset} className="cursor-pointer">{dataset}</Label>
                <Switch
                  id={dataset}
                  checked={selectedDatasets[dataset]}
                  onCheckedChange={() => handleDatasetToggle(dataset)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.image_url}
                alt="Training data"
                className="w-full h-32 object-cover rounded-lg border border-primary/20 group-hover:border-primary/50 transition-all"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                onClick={() => removeImage(img.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
