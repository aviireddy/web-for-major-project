-- Create storage buckets for images and models
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true),
       ('project-models', 'project-models', false);

-- RLS policies for project-images bucket
CREATE POLICY "Users can upload images to their projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view images from their projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images from their projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- RLS policies for project-models bucket
CREATE POLICY "Users can upload models to their projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-models' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view models from their projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-models' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete models from their projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-models' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Add model_url and datasets columns to projects table
ALTER TABLE projects 
ADD COLUMN model_url TEXT,
ADD COLUMN selected_datasets TEXT[] DEFAULT '{}';

-- Add attack results table for storing PGD and FGSM results
CREATE TABLE attack_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  attack_type TEXT NOT NULL,
  accuracy NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE attack_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attack results from their projects"
ON attack_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = attack_results.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create attack results for their projects"
ON attack_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = attack_results.project_id
    AND projects.user_id = auth.uid()
  )
);