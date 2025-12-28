import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, FlaskConical } from 'lucide-react';
import TestImageGrid from './TestImageGrid';

const TEST_TYPES = [
  { value: 'sand_grinding', label: 'Sand Grinding', params: { pressure: '9Kpa', sample_size: '38 +- 2mm samples', revolutions: '50 rub revolutions', checkpoint: 'Checkpoint every 10' } },
  { value: 'dry_grinding', label: 'Dry Grinding', params: { pressure: '12 Kpa', sample_size: '38 +- 2mm samples', revolutions: '30,000 rub revolutions', checkpoint: 'Check point every 5k' } },
  { value: 'wet_grinding', label: 'Wet Grinding', params: { pressure: '12 Kpa', sample_size: '38 +- 2mm samples', revolutions: '12K rub revolutions', checkpoint: 'Check point every 4k' } },
  { value: 'bally_flex_rt', label: 'Bally Flex Room Temperature', params: { sample_size: '70x45mm Samples', revolutions: '150K Bally Bending', checkpoint: 'Check point every 50k' } },
  { value: 'bally_flex_minus20', label: 'Bally Flex -20°C', params: { sample_size: '70x45mm Samples', revolutions: '150K Bally Bending', checkpoint: 'Check point every 50k' } }
];

export default function TestsSection({ fabrics, tests, onChange }) {
  const [selectedFabric, setSelectedFabric] = useState(0);

  const addTest = (fabricIndex) => {
    const newTest = {
      fabricIndex,
      test_type: '',
      test_parameters: {},
      result: 'fail',
      images_grid: [],
      grid_columns: [],
      row_labels: [],
      notes: ''
    };
    onChange([...tests, newTest]);
  };

  const removeTest = (testIndex) => {
    onChange(tests.filter((_, i) => i !== testIndex));
  };

  const updateTest = (testIndex, field, value) => {
    const updated = [...tests];
    updated[testIndex] = { ...updated[testIndex], [field]: value };
    
    // Auto-populate test parameters when test type changes
    if (field === 'test_type') {
      const testConfig = TEST_TYPES.find(t => t.value === value);
      if (testConfig) {
        updated[testIndex].test_parameters = testConfig.params;
        updated[testIndex].grid_columns = []; // Reset columns when changing test type
      }
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

  const fabricTests = tests.filter(t => t.fabricIndex === selectedFabric);

  if (fabrics.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <FlaskConical className="w-5 h-5 text-slate-600" />
            Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Add fabrics first before adding tests.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <FlaskConical className="w-5 h-5 text-slate-600" />
            Tests
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={selectedFabric.toString()} onValueChange={(v) => setSelectedFabric(parseInt(v))}>
          <TabsList className="mb-4">
            {fabrics.map((fabric, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {fabric.name || `Fabric ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {fabrics.map((fabric, fabricIndex) => (
            <TabsContent key={fabricIndex} value={fabricIndex.toString()} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Tests for {fabric.name || `Fabric ${fabricIndex + 1}`}
                </h3>
                <Button onClick={() => addTest(fabricIndex)} size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Test
                </Button>
              </div>

              {fabricTests.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                  <p>No tests added for this fabric yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tests.map((test, testIndex) => {
                    if (test.fabricIndex !== fabricIndex) return null;
                    
                    return (
                      <div key={testIndex} className="border border-slate-200 rounded-lg p-6 space-y-4 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-md font-semibold text-slate-700">Test {testIndex + 1}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTest(testIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700">Test Type</Label>
                            <Select
                              value={test.test_type}
                              onValueChange={(value) => updateTest(testIndex, 'test_type', value)}
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
                            <Label className="text-slate-700">Result</Label>
                            <Select
                              value={test.result}
                              onValueChange={(value) => updateTest(testIndex, 'result', value)}
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

                        {test.test_type && (
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
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-slate-700">Test Images Grid</Label>
                              <TestImageGrid
                                testType={test.test_type}
                                imagesGrid={test.images_grid}
                                onChange={(grid) => updateTest(testIndex, 'images_grid', grid)}
                                columns={test.grid_columns}
                                onColumnsChange={(cols) => updateTest(testIndex, 'grid_columns', cols)}
                                rowLabels={test.row_labels}
                                onRowLabelsChange={(labels) => updateTest(testIndex, 'row_labels', labels)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-slate-700">Notes</Label>
                              <Textarea
                                value={test.notes || ''}
                                onChange={(e) => updateTest(testIndex, 'notes', e.target.value)}
                                placeholder="Additional observations or notes about this test..."
                                className="border-slate-300 min-h-[80px]"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}