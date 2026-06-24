import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CuringResultCell({ cell = {}, onChange, readOnly = false }) {
  const [uploading, setUploading] = useState(false);

  const update = (field, value) => onChange({ ...cell, [field]: value });

  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('image_url', file_url);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-w-48 space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={cell.result === 'pass' ? 'default' : 'outline'}
          onClick={() => update('result', 'pass')}
          disabled={readOnly}
          className={cell.result === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Pass
        </Button>
        <Button
          type="button"
          size="sm"
          variant={cell.result === 'fail' ? 'destructive' : 'outline'}
          onClick={() => update('result', 'fail')}
          disabled={readOnly}
        >
          Fail
        </Button>
      </div>

      <Textarea
        value={cell.text || ''}
        onChange={(e) => update('text', e.target.value)}
        placeholder="Result notes..."
        className="min-h-20 text-xs"
        readOnly={readOnly}
      />

      {cell.image_url ? (
        <div className="relative border rounded-md p-2 bg-white">
          <img src={cell.image_url} alt="Curing test" className="w-full h-28 object-contain" />
          {!readOnly && (
            <button
              type="button"
              onClick={() => update('image_url', '')}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : !readOnly && (
        <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 text-xs text-slate-500">
          <Input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" />
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Add image'}
        </label>
      )}
    </div>
  );
}