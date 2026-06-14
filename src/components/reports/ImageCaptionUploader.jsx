import React, { useState } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function ImageCaptionUploader({ title, images = [], onChange, readOnly = false }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...images, { image_url: file_url, caption: '' }]);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const updateCaption = (index, caption) => {
    onChange(images.map((image, i) => i === index ? { ...image, caption } : image));
  };

  const removeImage = (index) => {
    const removedImage = images[index];
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    toast({
      title: 'Image removed',
      description: 'Use Undo to restore it.',
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const restored = [...updated];
            restored.splice(index, 0, removedImage);
            onChange(restored);
          }}
        >
          Undo
        </Button>
      )
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-slate-700">{title}</Label>
        {!readOnly && (
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 text-sm">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Add image
          </label>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <img src={image.image_url} alt={image.caption || title} className="w-full h-48 object-contain rounded bg-slate-50 border" />
              <Input
                value={image.caption || ''}
                onChange={(e) => updateCaption(index, e.target.value)}
                placeholder="Image text / caption for the report"
                readOnly={readOnly}
                className="border-slate-300"
              />
              {!readOnly && (
                <Button variant="ghost" size="sm" onClick={() => removeImage(index)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" /> Remove image
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}