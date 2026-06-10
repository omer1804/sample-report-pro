import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, Image as ImageIcon, FlaskConical, Copy } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import TestsSection from './TestsSection';
import ImageViewerModal from './ImageViewerModal';

const machineModelOptions = ['Presto MAX PLUS', 'Atlas MATRIX'];
const inkVersionOptions = ['robusto', 'eco rapid'];

export default function FabricsSection({ fabrics, onChange, tests, onTestsChange, readOnly = false }) {
  const emptyFieldClass = (value) => !readOnly && !value ? 'border-red-300 bg-red-50/40' : 'border-slate-300';
  const [uploading, setUploading] = useState({});
  const [selectedFabric, setSelectedFabric] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);

  const getSelectValue = (value, options) => {
    if (!value) return '';
    return options.includes(value) ? value : 'custom';
  };

  const getNextFabricNumber = () => String(fabrics.length + 1).padStart(3, '0');

  const addFabric = () => {
    const newIndex = fabrics.length;
    onChange([...fabrics, {
      name: getNextFabricNumber(),
      material_description: '',
      images: [],
      image_captions: []
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
    const duplicatedTests = fabricTests.map(test => {
      const { id, ...testCopy } = test;
      return {
        ...testCopy,
        fabricIndex: index + 1
      };
    });
    
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

  const calculateWhiteColorTotal = (fabric) => {
    const values = [
      parseFloat(fabric.ink_consumption_cyan || 0),
      parseFloat(fabric.ink_consumption_magenta || 0),
      parseFloat(fabric.ink_consumption_yellow || 0),
      parseFloat(fabric.ink_consumption_black || 0),
      parseFloat(fabric.ink_consumption_neon || 0),
      parseFloat(fabric.ink_consumption_fof_color || 0),
      parseFloat(fabric.ink_consumption_white || 0),
      parseFloat(fabric.ink_consumption_fof_white || 0)
    ];
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum > 0 ? sum.toFixed(2) : '';
  };

  const calculateTopCoatTotal = (fabric) => {
    const values = [
      parseFloat(fabric.ink_consumption_u10 || 0),
      parseFloat(fabric.ink_consumption_fof_white_top_coat || 0)
    ];
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum > 0 ? sum.toFixed(2) : '';
  };

  const calculateGrandTotal = (fabric) => {
    const values = [
      parseFloat(fabric.ink_consumption_cyan || 0),
      parseFloat(fabric.ink_consumption_magenta || 0),
      parseFloat(fabric.ink_consumption_yellow || 0),
      parseFloat(fabric.ink_consumption_black || 0),
      parseFloat(fabric.ink_consumption_neon || 0),
      parseFloat(fabric.ink_consumption_fof_color || 0),
      parseFloat(fabric.ink_consumption_white || 0),
      parseFloat(fabric.ink_consumption_fof_white || 0),
      parseFloat(fabric.ink_consumption_u10 || 0),
      parseFloat(fabric.ink_consumption_fof_white_top_coat || 0)
    ];
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum > 0 ? sum.toFixed(2) : '';
  };

  const updateFabricWithTotal = (index, field, value) => {
    const updated = [...fabrics];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].ink_consumption_total = calculateGrandTotal(updated[index]);
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
      updated[fabricIndex].image_captions = [...(updated[fabricIndex].image_captions || []), ''];
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
    updated[fabricIndex].image_captions = (updated[fabricIndex].image_captions || []).filter((_, i) => i !== imageIndex);
    onChange(updated);
  };

  const updateImageCaption = (fabricIndex, imageIndex, caption) => {
    const updated = [...fabrics];
    const captions = [...(updated[fabricIndex].image_captions || [])];
    captions[imageIndex] = caption;
    updated[fabricIndex].image_captions = captions;
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
                        <Label className="text-slate-700">Fabric Number</Label>
                        <Input
                          value={fabric.name || ''}
                          onChange={(e) => updateFabric(index, 'name', e.target.value)}
                          placeholder="001"
                          className={emptyFieldClass(fabric.name)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700">Material Composition</Label>
                        <Textarea
                          value={fabric.material_description || ''}
                          onChange={(e) => updateFabric(index, 'material_description', e.target.value)}
                          placeholder=""
                          className={`${emptyFieldClass(fabric.material_description)} min-h-[80px]`}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700">Working Point</Label>
                        <Input
                          value={fabric.working_point || ''}
                          onChange={(e) => updateFabric(index, 'working_point', e.target.value)}
                          placeholder=""
                          className={emptyFieldClass(fabric.working_point)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Machine Model</Label>
                          <Select
                            value={getSelectValue(fabric.machine_model, machineModelOptions)}
                            onValueChange={(value) => updateFabric(index, 'machine_model', value)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className={emptyFieldClass(fabric.machine_model)}>
                              <SelectValue placeholder="Choose machine model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Presto MAX PLUS">Presto MAX PLUS</SelectItem>
                              <SelectItem value="Atlas MATRIX">Atlas MATRIX</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!readOnly && getSelectValue(fabric.machine_model, machineModelOptions) === 'custom') && (
                            <Input
                              value={fabric.machine_model === 'custom' ? '' : (fabric.machine_model || '')}
                              onChange={(e) => updateFabric(index, 'machine_model', e.target.value)}
                              placeholder="Enter custom machine model"
                              className="border-slate-300"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700">Ink Version</Label>
                          <Select
                            value={getSelectValue(fabric.ink_version, inkVersionOptions)}
                            onValueChange={(value) => updateFabric(index, 'ink_version', value)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className={emptyFieldClass(fabric.ink_version)}>
                              <SelectValue placeholder="Choose ink version" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="robusto">robusto</SelectItem>
                              <SelectItem value="eco rapid">eco rapid</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!readOnly && getSelectValue(fabric.ink_version, inkVersionOptions) === 'custom') && (
                            <Input
                              value={fabric.ink_version === 'custom' ? '' : (fabric.ink_version || '')}
                              onChange={(e) => updateFabric(index, 'ink_version', e.target.value)}
                              placeholder="Enter custom ink version"
                              className="border-slate-300"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700">Set Up</Label>
                          <Input
                            value={fabric.setup || ''}
                            onChange={(e) => updateFabric(index, 'setup', e.target.value)}
                            className={emptyFieldClass(fabric.setup)}
                            readOnly={readOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700">Resolution</Label>
                          <Input
                            value={fabric.resolution || ''}
                            onChange={(e) => updateFabric(index, 'resolution', e.target.value)}
                            className={emptyFieldClass(fabric.resolution)}
                            readOnly={readOnly}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 space-y-4">
                        <Label className="text-slate-800 font-semibold text-base">Ink Consumption (ml)</Label>

                        {/* White & Color Section */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">White & Color</Label>
                          <div className="flex flex-wrap gap-2 items-end">
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">Cyan</Label>
                              <Input
                                value={fabric.ink_consumption_cyan || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_cyan', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">Magenta</Label>
                              <Input
                                value={fabric.ink_consumption_magenta || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_magenta', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">Yellow</Label>
                              <Input
                                value={fabric.ink_consumption_yellow || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_yellow', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">Black</Label>
                              <Input
                                value={fabric.ink_consumption_black || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_black', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">Neon</Label>
                              <Input
                                value={fabric.ink_consumption_neon || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_neon', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">FoF Color</Label>
                              <Input
                                value={fabric.ink_consumption_fof_color || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_fof_color', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">White</Label>
                              <Input
                                value={fabric.ink_consumption_white || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_white', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">FoF White</Label>
                              <Input
                                value={fabric.ink_consumption_fof_white || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_fof_white', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600 font-semibold">Total</Label>
                              <Input
                                value={calculateWhiteColorTotal(fabric)}
                                className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed"
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>

                        {/* Top Coat U10 Section */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">Top Coat U10</Label>
                          <div className="flex flex-wrap gap-2 items-end">
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">U10</Label>
                              <Input
                                value={fabric.ink_consumption_u10 || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_u10', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600">FoF White Top Coat</Label>
                              <Input
                                value={fabric.ink_consumption_fof_white_top_coat || ''}
                                onChange={(e) => updateFabricWithTotal(index, 'ink_consumption_fof_white_top_coat', e.target.value)}
                                className="border-slate-300 bg-white h-9"
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-1" style={{minWidth: '70px'}}>
                              <Label className="text-xs text-slate-600 font-semibold">Total</Label>
                              <Input
                                value={calculateTopCoatTotal(fabric)}
                                className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed"
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>

                        {/* Total Amount of ink */}
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <div className="space-y-1">
                              <Label className="text-sm font-semibold text-slate-700">Total Amount of ink</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={fabric.ink_consumption_total || calculateGrandTotal(fabric)}
                                  className="border-slate-300 bg-slate-200 h-9 font-bold text-lg cursor-not-allowed"
                                  style={{minWidth: '100px'}}
                                  readOnly
                                  disabled
                                />
                                <span className="text-sm font-semibold">ML</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Curing Time (min)</Label>
                          <Input
                            type="number"
                            value={fabric.curing_time_min || ''}
                            onChange={(e) => updateFabric(index, 'curing_time_min', e.target.value ? Number(e.target.value) : null)}
                            placeholder=""
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
                            placeholder=""
                            className="border-slate-300"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700">Fabric Images</Label>
                        <div className="flex flex-wrap gap-3">
                          {fabric.images?.map((imageUrl, imgIndex) => (
                            <div key={imgIndex} className="relative group space-y-2 w-40">
                              <img
                                src={imageUrl}
                                alt={`Fabric ${index + 1} - ${imgIndex + 1}`}
                                className="w-40 h-28 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-500 transition-colors"
                                onClick={() => setViewerImage(imageUrl)}
                              />
                              <Input
                                value={fabric.image_captions?.[imgIndex] || ''}
                                onChange={(e) => updateImageCaption(index, imgIndex, e.target.value)}
                                placeholder="Image text for report"
                                className="border-slate-300 text-xs h-8"
                                readOnly={readOnly}
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