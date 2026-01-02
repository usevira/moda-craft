import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface EditStampModalProps {
  stamp: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStampModal({ stamp, open, onOpenChange }: EditStampModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (stamp) {
      setName(stamp.name || '');
      setCode(stamp.code || '');
      setCategory(stamp.category || '');
      setDescription(stamp.description || '');
      setIsActive(stamp.is_active ?? true);
      setImagePreview(stamp.image_url || null);
    }
  }, [stamp]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl: string | null = stamp.image_url;

      // Upload new image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('stamp-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stamp-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } else if (!imagePreview) {
        imageUrl = null;
      }

      const { error } = await supabase
        .from('stamps')
        .update({
          name,
          code: code || null,
          category: category || null,
          description: description || null,
          image_url: imageUrl,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stamp.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estampa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['stamps'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar estampa: ' + error.message);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Estampa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Imagem da Estampa</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para enviar imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Floral Verão"
              />
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: FL-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Floral, Abstrato, Geométrico..."
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da estampa..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Estampa Ativa</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!name || updateMutation.isPending || uploading}
            >
              {uploading ? 'Enviando...' : updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
