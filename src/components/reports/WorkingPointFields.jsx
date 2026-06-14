import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fixedPoints = [
  ['working_point_q', 'U'],
  ['working_point_qu', 'QU'],
  ['working_point_w', 'W'],
  ['working_point_qw', 'QW']
];

export default function WorkingPointFields({ fabric, index, updateFabric, readOnly, emptyFieldClass }) {
  const customPoints = fabric.working_point_custom || [];
  const updateCustom = (customIndex, field, value) => {
    const updated = [...customPoints];
    updated[customIndex] = { ...updated[customIndex], [field]: value };
    updateFabric(index, 'working_point_custom', updated);
  };

  const addCustom = () => {
    if (customPoints.length >= 5) return;
    updateFabric(index, 'working_point_custom', [...customPoints, { letter: '', value: '' }]);
  };

  return (
    <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <Label className="text-slate-700 font-semibold">Working Point (%)</Label>
        {!readOnly && customPoints.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={addCustom} className="gap-2">
            <Plus className="w-3 h-3" /> Custom
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fixedPoints.map(([field, label]) => (
          <div key={field} className="space-y-1">
            <Label className="text-xs text-slate-600">{label}</Label>
            <Input value={fabric[field] || ''} onChange={(e) => updateFabric(index, field, e.target.value)} placeholder="%" className={emptyFieldClass(fabric[field])} readOnly={readOnly} />
          </div>
        ))}
      </div>
      {customPoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customPoints.map((point, customIndex) => (
            <div key={customIndex} className="flex gap-2 items-end">
              <Input value={point.letter || ''} onChange={(e) => updateCustom(customIndex, 'letter', e.target.value)} placeholder="Letter" className="border-slate-300" readOnly={readOnly} />
              <Input value={point.value || ''} onChange={(e) => updateCustom(customIndex, 'value', e.target.value)} placeholder="%" className="border-slate-300" readOnly={readOnly} />
              {!readOnly && <Button type="button" variant="ghost" size="icon" onClick={() => updateFabric(index, 'working_point_custom', customPoints.filter((_, i) => i !== customIndex))}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}