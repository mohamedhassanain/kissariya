import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, folder: string = 'products'): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('shop-images')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
}