import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Thermometer } from 'lucide-react';
import CuringResultCell from './CuringResultCell';

const defaultReport = {
  columns: ['130', '120', '110', '100'],
  rows: [],
  notes: ''
};

const emptyCell = () => ({ text: '', image_url: '', result: '' });

export default function CuringTestReportSection({ report, onChange, readOnly = false }) {
  const data = report?.columns ? report : defaultReport;

  const update = (patch) => onChange({ ...data, ...patch });

  const addFabric = () => {
    update({
      rows: [
        ...(data.rows || []),
        { fabric_name: '', material: '', cells: data.columns.map(() => emptyCell()) }
      ]
    });
  };

  const addColumn = () => {
    const nextColumns = [...data.columns, 'New column'];
    update({
      columns: nextColumns,
      rows: (data.rows || []).map(row => ({ ...row, cells: [...(row.cells || []), emptyCell()] }))
    });
  };

  const updateColumn = (index, value) => {
    const columns = [...data.columns];
    columns[index] = value;
    update({ columns });
  };

  const updateRow = (rowIndex, field, value) => {
    const rows = [...(data.rows || [])];
    rows[rowIndex] = { ...rows[rowIndex], [field]: value };
    update({ rows });
  };

  const updateCell = (rowIndex, cellIndex, value) => {
    const rows = [...(data.rows || [])];
    const cells = [...(rows[rowIndex].cells || [])];
    cells[cellIndex] = value;
    rows[rowIndex] = { ...rows[rowIndex], cells };
    update({ rows });
  };

  const removeRow = (rowIndex) => update({ rows: (data.rows || []).filter((_, index) => index !== rowIndex) });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Thermometer className="w-5 h-5 text-slate-600" />
          Curing Test Report
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {!readOnly && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={addFabric} className="gap-2"><Plus className="w-4 h-4" /> Add Fabric</Button>
            <Button onClick={addColumn} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Add Column</Button>
          </div>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className="border-collapse min-w-full text-sm">
            <thead>
              <tr className="bg-sky-900 text-white">
                <th className="border border-slate-700 p-2 min-w-20">#</th>
                <th className="border border-slate-700 p-2 min-w-48">Fabric Name</th>
                <th className="border border-slate-700 p-2 min-w-44">Material</th>
                {data.columns.map((column, index) => (
                  <th key={index} className="border border-slate-700 p-2 min-w-56">
                    <Input value={column} onChange={(e) => updateColumn(index, e.target.value)} readOnly={readOnly} className="bg-white text-slate-900 text-center font-semibold" />
                  </th>
                ))}
                {!readOnly && <th className="border border-slate-700 p-2">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {(data.rows || []).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border p-2 text-center font-semibold bg-slate-50">{rowIndex + 1}</td>
                  <td className="border p-2"><Input value={row.fabric_name || ''} onChange={(e) => updateRow(rowIndex, 'fabric_name', e.target.value)} readOnly={readOnly} placeholder="Fabric name" /></td>
                  <td className="border p-2"><Input value={row.material || ''} onChange={(e) => updateRow(rowIndex, 'material', e.target.value)} readOnly={readOnly} placeholder="Material" /></td>
                  {data.columns.map((_, cellIndex) => (
                    <td key={cellIndex} className="border p-2 align-top bg-blue-50/40">
                      <CuringResultCell cell={row.cells?.[cellIndex] || emptyCell()} onChange={(value) => updateCell(rowIndex, cellIndex, value)} readOnly={readOnly} />
                    </td>
                  ))}
                  {!readOnly && <td className="border p-2 text-center"><Button variant="ghost" size="icon" onClick={() => removeRow(rowIndex)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button></td>}
                </tr>
              ))}
            </tbody>
          </table>
          {(data.rows || []).length === 0 && <div className="text-center py-10 text-slate-500">No curing fabrics yet. Click Add Fabric to start.</div>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Application Notes</label>
          <Textarea value={data.notes || ''} onChange={(e) => update({ notes: e.target.value })} readOnly={readOnly} placeholder="Enter curing test notes..." className="min-h-28" />
        </div>
      </CardContent>
    </Card>
  );
}