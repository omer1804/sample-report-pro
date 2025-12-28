import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function FabricsSection({ fabrics, onChange }) {
  const [uploading, setUploading] = useState({});

  const addFabric = () => {
    onChange([...fabrics, {
      name: '',
      material_description: '',
      images: []
    }]);
  };

  const removeFabric = (index) => {
    onChange(fabrics.filter((_, i) => i !== index));
  };

  const updateFabric = (index, field, value) => {
    const updated = [...fabrics];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleImageUpload = async (fabricIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, [fabricIndex]: true });
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = [...fabrics];
      updated[fabricIndex].images = [...(updated[fabricIndex].images || []), file_url];
      onChange(updated);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading({ ...uploading, [fabricIndex]: false });
    }
  };

  const removeImage = (fabricIndex, imageIndex) => {
    const updated = [...fabrics];
    updated[fabricIndex].images = updated[fabricIndex].images.filter((_, i) => i !== imageIndex);
    onChange(updated);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <ImageIcon className="w-5 h-5 text-slate-600" />
            Fabric Details
          </CardTitle>
          <Button onClick={addFabric} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Fabric
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {fabrics.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No fabrics added yet. Click "Add Fabric" to start.</p>
          </div>
        ) : (
          fabrics.map((fabric, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-6 space-y-4 bg-white">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Fabric {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFabric(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Fabric Name</Label>
                  <Input
                    value={fabric.name || ''}
                    onChange={(e) => updateFabric(index, 'name', e.target.value)}
                    placeholder="e.g., Butter Yellow"
                    className="border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Material Composition</Label>
                  <Textarea
                    value={fabric.material_description || ''}
                    onChange={(e) => updateFabric(index, 'material_description', e.target.value)}
                    placeholder="e.g., 97% Recycled Polyester (84% Recycled Polyester + 13% Recycled Polyester mono) + 3% Elastane"
                    className="border-slate-300 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Fabric Images</Label>
                  <div className="flex flex-wrap gap-3">
                    {fabric.images?.map((imageUrl, imgIndex) => (
                      <div key={imgIndex} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Fabric ${index + 1} - ${imgIndex + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
                        />
                        <button
                          onClick={() => removeImage(index, imgIndex)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="hidden"
                        disabled={uploading[index]}
                      />
                      {uploading[index] ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-400" />
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}