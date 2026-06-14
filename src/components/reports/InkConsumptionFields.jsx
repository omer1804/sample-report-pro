import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const colorFields = [
  ['ink_consumption_cyan', 'Cyan'],
  ['ink_consumption_magenta', 'Magenta'],
  ['ink_consumption_yellow', 'Yellow'],
  ['ink_consumption_black', 'Black'],
  ['ink_consumption_neon_pink', 'Neon Pink'],
  ['ink_consumption_neon_yellow', 'Neon Yellow'],
  ['ink_consumption_red', 'Red'],
  ['ink_consumption_green', 'Green'],
  ['ink_consumption_fof_color', 'FoF Color'],
  ['ink_consumption_white', 'White'],
  ['ink_consumption_fof_white', 'U10 White']
];

const topCoatFields = [
  ['ink_consumption_u10', 'U10'],
  ['ink_consumption_fof_white_top_coat', 'FoF White Top Coat']
];

function Field({ fabric, field, label, onChange, readOnly }) {
  return (
    <div className="space-y-1" style={{ minWidth: '70px' }}>
      <Label className="text-xs text-slate-600">{label}</Label>
      <Input value={fabric[field] || ''} onChange={(e) => onChange(field, e.target.value)} className="border-slate-300 bg-white h-9" readOnly={readOnly} />
    </div>
  );
}

export default function InkConsumptionFields({ fabric, index, updateFabric, updateFabricWithTotal, calculateWhiteColorTotal, calculateTopCoatTotal, calculateGrandTotal, readOnly }) {
  const unit = fabric.ink_consumption_unit || 'ml/m²';
  const updateInk = (field, value) => updateFabricWithTotal(index, field, value);

  return (
    <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label className="text-slate-800 font-semibold text-base">Ink Consumption</Label>
        <Select value={unit} onValueChange={(value) => updateFabric(index, 'ink_consumption_unit', value)} disabled={readOnly}>
          <SelectTrigger className="w-32 bg-white border-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="ml/m²">ml/m²</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">White & Color</Label>
        <div className="flex flex-wrap gap-2 items-end">
          {colorFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} />)}
          <div className="space-y-1" style={{ minWidth: '70px' }}>
            <Label className="text-xs text-slate-600 font-semibold">Total</Label>
            <Input value={calculateWhiteColorTotal(fabric)} className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed" readOnly disabled />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Top Coat U10</Label>
        <div className="flex flex-wrap gap-2 items-end">
          {topCoatFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} />)}
          <div className="space-y-1" style={{ minWidth: '70px' }}>
            <Label className="text-xs text-slate-600 font-semibold">Total</Label>
            <Input value={calculateTopCoatTotal(fabric)} className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed" readOnly disabled />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-slate-700">Total Amount of ink</Label>
        <Input value={fabric.ink_consumption_total || calculateGrandTotal(fabric)} className="border-slate-300 bg-slate-200 h-9 font-bold text-lg cursor-not-allowed max-w-28" readOnly disabled />
        <span className="text-sm font-semibold">{unit}</span>
      </div>
    </div>
  );
}