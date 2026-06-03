import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, FlaskConical, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import TestImageGrid from './TestImageGrid';
import { base44 } from "@/api/base44Client";

const TEST_TYPES = [
  { value: 'sand_grinding', label: 'Sand Grinding', params: { pressure: '9Kpa', sample_size: '38 +- 2mm samples', revolutions: '50 rub revolutions', checkpoint: 'Checkpoint every 10' } },
  { value: 'dry_grinding', label: 'Dry Grinding', params: { pressure: '12 Kpa', sample_size: '38 +- 2mm samples', revolutions: '30,000 rub revolutions', checkpoint: 'Check point every 5k' } },
  { value: 'wet_grinding', label: 'Wet Grinding', params: { pressure: '12 Kpa', sample_size: '38 +- 2mm samples', revolutions: '12K rub revolutions', checkpoint: 'Check point every 4k' } },
  { value: 'bally_flex_rt', label: 'Bally Flex Room Temperature', params: { sample_size: '70x45mm Samples', revolutions: '150K Bally Bending', checkpoint: 'Check point every 50k' } },
  { value: 'bally_flex_minus20', label: 'Bally Flex -20°C', params: { sample_size: '70x45mm Samples', revolutions: '150K Bally Bending', checkpoint: 'Check point every 50k' } },
  { value: 'laundry_test', label: 'Laundry Test', params: { sample_size: '100x100mm Samples', washing_cycles: '5 washing cycles', temperature: '40°C', detergent: 'Standard detergent' } },
  { value: 'custom', label: 'Custom Test', params: {} }
];

export default function TestsSection({ fabricIndex, fabricName, tests, onChange, readOnly = false }) {
  const [uploadingCustom, setUploadingCustom] = useState({});

  const handleCustomImageUpload = async (testIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingCustom(prev => ({ ...prev, [testIndex]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = [...tests];
      const currentImages = updated[testIndex].custom_images || [];
      updated[testIndex] = { ...updated[testIndex], custom_images: [...currentImages, file_url] };
      onChange(updated);
    } finally {
      setUploadingCustom(prev => ({ ...prev, [testIndex]: false }));
    }
  };

  const removeCustomImage = (testIndex, imgIdx) => {
    const updated = [...tests];
    updated[testIndex] = {
      ...updated[testIndex],
      custom_images: updated[testIndex].custom_images.filter((_, i) => i !== imgIdx)
    };
    onChange(updated);
  };

  useEffect(() => {
    console.log('TestsSection - tests state updated:', tests.map((t, i) => ({
      index: i,
      fabricIndex: t.fabricIndex,
      gridRows: t.images_grid?.length,
      labels: t.row_labels?.length
    })));
  }, [tests]);

  const addTest = () => {
    const fabricTestCount = tests.filter(t => t.fabricIndex === fabricIndex).length;
    const newTest = {
      fabricIndex: fabricIndex,
      test_type: '',
      test_number: `${fabricIndex + 1}.${fabricTestCount + 1}`,
      design_name: '',
      is_internal: false,
      export_selected: true,
      test_parameters: {},
      result: 'fail',
      images_grid: [],
      grid_columns: [],
      row_labels: [],
      custom_images: [],
      notes: ''
    };
    onChange([...tests, newTest]);
  };

  const removeTest = (testIndex) => {
    onChange(tests.filter((_, i) => i !== testIndex));
  };

  const moveTestUp = (testIndex) => {
    if (testIndex === 0) return;
    const updated = [...tests];
    [updated[testIndex - 1], updated[testIndex]] = [updated[testIndex], updated[testIndex - 1]];
    onChange(updated);
  };

  const moveTestDown = (testIndex) => {
    if (testIndex === tests.length - 1) return;
    const updated = [...tests];
    [updated[testIndex], updated[testIndex + 1]] = [updated[testIndex + 1], updated[testIndex]];
    onChange(updated);
  };

  const updateTest = (testIndex, field, value) => {
    console.log('TestsSection.updateTest called - testIndex:', testIndex, 'field:', field, 'value length:', Array.isArray(value) ? value.length : 'N/A');
    if (field === 'images_grid') {
      console.log('Updating images_grid to:', JSON.stringify(value));
    }
    if (field === 'row_labels') {
      console.log('Updating row_labels to:', value);
    }
    
    const updated = [...tests];
    updated[testIndex] = { ...updated[testIndex], [field]: value };
    
    console.log('After update - test images_grid length:', updated[testIndex].images_grid?.length, 'row_labels length:', updated[testIndex].row_labels?.length);
    
    // Auto-populate test parameters when test type changes
    if (field === 'test_type') {
      const testConfig = TEST_TYPES.find(t => t.value === value);
      if (testConfig) {
        updated[testIndex].test_parameters = testConfig.params;
        updated[testIndex].grid_columns = []; // Reset columns when changing test type
      }
    }

    if (field === 'is_internal' && value) {
      updated[testIndex].export_selected = false;
    }
    
    onChange(updated);
  };

  const updateTestParameter = (testIndex, paramKey, value) => {
    const updated = [...tests];
    updated[testIndex].test_parameters = {
      ...updated[testIndex].test_parameters,
      [paramKey]: value
    };
    onChange(updated);
  };

  const fabricTests = tests.filter(t => t.fabricIndex === fabricIndex);

  return (
    <div className="border border-slate-200 rounded-lg p-6 space-y-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-slate-600" />
          Tests for {fabricName}
        </h3>
      </div>

      {fabricTests.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg bg-white">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No tests added yet. Click the floating button to add a test.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tests.map((test, testIndex) => {
            if (test.fabricIndex !== fabricIndex) return null;

            const fabricTestIndex = fabricTests.findIndex((t, idx) => tests[testIndex] === t) + 1;

            return (
              <div key={testIndex} className="border border-slate-200 rounded-lg p-6 space-y-4 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-md font-semibold text-slate-700">Test {fabricIndex + 1}.{fabricTestIndex}</h4>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTestUp(testIndex)}
                        disabled={testIndex === 0}
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTestDown(testIndex)}
                        disabled={testIndex === tests.length - 1}
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTest(testIndex)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Test Number</Label>
                    <Input
                      value={test.test_number || `${fabricIndex + 1}.${fabricTestIndex}`}
                      onChange={(e) => updateTest(testIndex, 'test_number', e.target.value)}
                      className="border-slate-300"
                      readOnly={readOnly}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">Test Type</Label>
                    <Select
                      value={test.test_type}
                      onValueChange={(value) => updateTest(testIndex, 'test_type', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_TYPES.map((testType) => (
                          <SelectItem key={testType.value} value={testType.value}>
                            {testType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">Export</Label>
                    <div className="flex items-center gap-4 h-10">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!test.is_internal}
                          onChange={(e) => updateTest(testIndex, 'is_internal', e.target.checked)}
                          disabled={readOnly}
                        />
                        Internal test
                      </label>
                      <label className={`flex items-center gap-2 text-sm ${test.is_internal ? 'text-slate-400' : 'text-slate-700'}`}>
                        <input
                          type="checkbox"
                          checked={!test.is_internal && test.export_selected !== false}
                          onChange={(e) => updateTest(testIndex, 'export_selected', e.target.checked)}
                          disabled={readOnly || test.is_internal}
                        />
                        Include in export
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">Result</Label>
                    <Select
                      value={test.result}
                      onValueChange={(value) => updateTest(testIndex, 'result', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Pass
                          </span>
                        </SelectItem>
                        <SelectItem value="fail">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Fail
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {test.test_type === 'custom' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Custom Test Title</Label>
                      <Input
                        value={test.custom_title || ''}
                        onChange={(e) => updateTest(testIndex, 'custom_title', e.target.value)}
                        placeholder="Enter test title"
                        className="border-slate-300"
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Description / Notes</Label>
                      <Textarea
                        value={test.notes || ''}
                        onChange={(e) => updateTest(testIndex, 'notes', e.target.value)}
                        placeholder="Describe the test, observations, results..."
                        className="border-slate-300 min-h-[120px]"
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Images</Label>
                      <div className="flex flex-wrap gap-3">
                        {(test.custom_images || []).map((url, imgIdx) => (
                          <div key={imgIdx} className="relative group">
                            <img
                              src={url}
                              alt={`Custom ${imgIdx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
                            />
                            {!readOnly && (
                              <button
                                onClick={() => removeCustomImage(testIndex, imgIdx)}
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
                              onChange={(e) => handleCustomImageUpload(testIndex, e)}
                              className="hidden"
                              disabled={uploadingCustom[testIndex]}
                            />
                            {uploadingCustom[testIndex] ? (
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-slate-400" />
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {test.test_type && test.test_type !== 'custom' && (
                  <>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <h5 className="font-semibold text-sm text-slate-700 mb-2">Test Parameters (Editable)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {test.test_parameters?.pressure !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Pressure</Label>
                            <Input
                              value={test.test_parameters.pressure}
                              onChange={(e) => updateTestParameter(testIndex, 'pressure', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="e.g., 9Kpa"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.sample_size !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Sample Size</Label>
                            <Input
                              value={test.test_parameters.sample_size}
                              onChange={(e) => updateTestParameter(testIndex, 'sample_size', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="e.g., 38 +- 2mm"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.revolutions !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Revolutions</Label>
                            <Input
                              value={test.test_parameters.revolutions}
                              onChange={(e) => updateTestParameter(testIndex, 'revolutions', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="e.g., 50 rub revolutions"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.checkpoint !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Checkpoint</Label>
                            <Input
                              value={test.test_parameters.checkpoint}
                              onChange={(e) => updateTestParameter(testIndex, 'checkpoint', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="e.g., Checkpoint every 10"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.washing_cycles !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Washing Cycles</Label>
                            <Input
                              value={test.test_parameters.washing_cycles}
                              onChange={(e) => updateTestParameter(testIndex, 'washing_cycles', e.target.value)}
                              className="h-8 text-sm"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.temperature !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Temperature</Label>
                            <Input
                              value={test.test_parameters.temperature}
                              onChange={(e) => updateTestParameter(testIndex, 'temperature', e.target.value)}
                              className="h-8 text-sm"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                        {test.test_parameters?.detergent !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Detergent</Label>
                            <Input
                              value={test.test_parameters.detergent}
                              onChange={(e) => updateTestParameter(testIndex, 'detergent', e.target.value)}
                              className="h-8 text-sm"
                              readOnly={readOnly}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700">Design Name</Label>
                      <Input
                        value={test.design_name || ''}
                        onChange={(e) => updateTest(testIndex, 'design_name', e.target.value)}
                        placeholder="Enter design name"
                        className="border-slate-300"
                        readOnly={readOnly}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700">Test Images Grid</Label>
                      <TestImageGrid
                        testType={test.test_type}
                        imagesGrid={test.images_grid}
                        onChange={(grid, labels) => {
                          if (labels !== undefined) {
                            // Update both grid and labels atomically
                            const updated = [...tests];
                            updated[testIndex] = { 
                              ...updated[testIndex], 
                              images_grid: grid,
                              row_labels: labels
                            };
                            onChange(updated);
                          } else {
                            updateTest(testIndex, 'images_grid', grid);
                          }
                        }}
                        columns={test.grid_columns}
                        onColumnsChange={(cols) => updateTest(testIndex, 'grid_columns', cols)}
                        rowLabels={test.row_labels}
                        onRowLabelsChange={(labels) => updateTest(testIndex, 'row_labels', labels)}
                        readOnly={readOnly}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700">Notes</Label>
                      <Textarea
                        value={test.notes || ''}
                        onChange={(e) => updateTest(testIndex, 'notes', e.target.value)}
                        placeholder="Additional observations or notes about this test..."
                        className="border-slate-300 min-h-[80px]"
                        readOnly={readOnly}
                      />
                    </div>
                  </>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Test Button */}
      {!readOnly && (
        <Button
          onClick={addTest}
          className="fixed bottom-20 right-6 h-14 px-6 gap-2 shadow-xl bg-green-600 hover:bg-green-700 z-50"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add Test
        </Button>
      )}
    </div>
  );
}