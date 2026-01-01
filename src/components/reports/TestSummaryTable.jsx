import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ClipboardList } from 'lucide-react';

const TEST_LABELS = {
  sand_grinding: 'Sand Grinding',
  dry_grinding: 'Dry Grinding',
  wet_grinding: 'Wet Grinding',
  bally_flex_rt: 'Bally Flex RT',
  bally_flex_minus20: 'Bally Flex -20°C'
};

export default function TestSummaryTable({ fabrics, tests, onTestResultChange }) {
  const updateTestResult = (testIndex, newResult) => {
    const updated = [...tests];
    updated[testIndex].result = newResult;
    onTestResultChange(updated);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <ClipboardList className="w-5 h-5 text-slate-600" />
          Test Results Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {tests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tests added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-left text-sm font-semibold text-slate-700">Fabric</th>
                  <th className="border border-slate-300 p-3 text-left text-sm font-semibold text-slate-700">Test Type</th>
                  <th className="border border-slate-300 p-3 text-center text-sm font-semibold text-slate-700">Result</th>
                  <th className="border border-slate-300 p-3 text-left text-sm font-semibold text-slate-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, testIndex) => {
                  const fabric = fabrics[test.fabricIndex];
                  const fabricName = fabric?.name || `Fabric ${test.fabricIndex + 1}`;
                  
                  return (
                    <tr key={testIndex} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-3 text-sm font-medium text-slate-700">
                        {fabricName}
                      </td>
                      <td className="border border-slate-300 p-3 text-sm text-slate-600">
                        {TEST_LABELS[test.test_type] || test.test_type}
                      </td>
                      <td className="border border-slate-300 p-3 text-center">
                        <Select
                          value={test.result}
                          onValueChange={(value) => updateTestResult(testIndex, value)}
                        >
                          <SelectTrigger className="w-32 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Pass
                              </span>
                            </SelectItem>
                            <SelectItem value="fail">
                              <span className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                Fail
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-slate-300 p-3 text-sm text-slate-600">
                        {test.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}