import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, Image as ImageIcon, FlaskConical, Copy } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import TestsSection from './TestsSection';
import ImageViewerModal from './ImageViewerModal';

export default function FabricsSection({ fabrics, onChange, tests, onTestsChange, readOnly = false }) {
  const [uploading, setUploading] = useState({});
  const [selectedFabric, setSelectedFabric] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);

  const addFabric = () => {
    const newIndex = fabrics.length;
    onChange([...fabrics, {
      name: '',
      material_description: '',
      images: []
    }]);
    setSelectedFabric(newIndex);
  };

  const removeFabric = (index) => {
    onChange(fabrics.filter((_, i) => i !== index));
  };

  const duplicateFabric = (index) => {
    const fabricToDuplicate = fabrics[index];
    const duplicated = {
      ...fabricToDuplicate,
      name: `${fabricToDuplicate.name} (Copy)`
    };
    const newFabrics = [...fabrics];
    newFabrics.splice(index + 1, 0, duplicated);
    onChange(newFabrics);
    setSelectedFabric(index + 1);

    // Duplicate tests for this fabric
    const fabricTests = tests.filter(t => t.fabricIndex === index);
    const duplicatedTests = fabricTests.map(test => ({
      ...test,
      fabricIndex: index + 1
    }));
    
    // Update fabric indices for tests after the duplicated fabric
    const updatedTests = tests.map(test => 
      test.fabricIndex > index ? { ...test, fabricIndex: test.fabricIndex + 1 } : test
    );
    
    onTestsChange([...updatedTests, ...duplicatedTests]);
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
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <ImageIcon className="w-5 h-5 text-slate-600" />
            Fabrics & Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {fabrics.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No fabrics added yet. Click the floating button to add a fabric.</p>
            </div>
          ) : (
            <Tabs value={selectedFabric.toString()} onValueChange={(v) => setSelectedFabric(parseInt(v))}>
              <TabsList className="mb-6">
                {fabrics.map((fabric, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    {fabric.name || `Fabric ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {fabrics.map((fabric, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-6">
                  {/* Fabric Details */}
                  <div className="border border-slate-200 rounded-lg p-6 space-y-4 bg-white">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">Fabric Details</h3>
                      {!readOnly && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicateFabric(index)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            title="Duplicate this fabric and its tests"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFabric(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700">Fabric Name</Label>
                        <Input
                          value={fabric.name || ''}
                          onChange={(e) => updateFabric(index, 'name', e.target.value)}
                          placeholder="e.g., Butter Yellow"
                          className="border-slate-300"
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700">Material Composition</Label>
                        <Textarea
                          value={fabric.material_description || ''}
                          onChange={(e) => updateFabric(index, 'material_description', e.target.value)}
                          placeholder="e.g., 97% Recycled Polyester + 3% Elastane"
                          className="border-slate-300 min-h-[80px]"
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Working Point</Label>
                          <Input
                            value={fabric.working_point || ''}
                            onChange={(e) => updateFabric(index, 'working_point', e.target.value)}
                            placeholder="e.g., 85/80"
                            className="border-slate-300"
                            readOnly={readOnly}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700">Ink Consumption</Label>
                          <Input
                            value={fabric.ink_consumption || ''}
                            onChange={(e) => updateFabric(index, 'ink_consumption', e.target.value)}
                            placeholder="e.g., 12 ml/m²"
                            className="border-slate-300"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Curing Time (min)</Label>
                          <Input
                            type="number"
                            value={fabric.curing_time_min || ''}
                            onChange={(e) => updateFabric(index, 'curing_time_min', e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g., 180"
                            className="border-slate-300"
                            readOnly={readOnly}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700">Curing Temp (°C)</Label>
                          <Input
                            type="number"
                            value={fabric.curing_temp_celsius || ''}
                            onChange={(e) => updateFabric(index, 'curing_temp_celsius', e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g., 160"
                            className="border-slate-300"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700">Fabric Images</Label>
                        <div className="flex flex-wrap gap-3">
                          {fabric.images?.map((imageUrl, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Fabric ${index + 1} - ${imgIndex + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-500 transition-colors"
                                onClick={() => setViewerImage(imageUrl)}
                              />
                              {!readOnly && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index, imgIndex);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tests for this fabric */}
                  <TestsSection 
                    fabricIndex={index} 
                    fabricName={fabric.name || `Fabric ${index + 1}`}
                    tests={tests} 
                    onChange={onTestsChange}
                    readOnly={readOnly}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Floating Add Fabric Button */}
      {!readOnly && (
        <Button
          onClick={addFabric}
          className="fixed bottom-6 right-6 h-14 px-6 gap-2 shadow-xl bg-blue-600 hover:bg-blue-700 z-50"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Fabric
        </Button>
      )}

      <ImageViewerModal 
        imageUrl={viewerImage} 
        isOpen={!!viewerImage} 
        onClose={() => setViewerImage(null)} 
      />
    </>
  );
}