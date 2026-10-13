import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const colorBaseFields = [
  ['ink_consumption_cyan', 'Cyan'],
  ['ink_consumption_magenta', 'Magenta'],
  ['ink_consumption_yellow', 'Yellow'],
  ['ink_consumption_black', 'Black']
];

const colorExtraFields = [
  ['ink_consumption_red', 'Red'],
  ['ink_consumption_green', 'Green']
];

const neonFields = [
  ['ink_consumption_neon_pink', 'NP'],
  ['ink_consumption_neon_yellow', 'NY']
];

const topCoatFields = [
  ['ink_consumption_u10', 'U10'],
  ['ink_consumption_fof_white_top_coat', 'FoF White Top Coat']
];

function Field({ fabric, field, label, onChange, readOnly, disabled = false }) {
  return (
    <div className="space-y-1" style={{ minWidth: '70px' }}>
      <Label className="text-xs text-slate-600">{label}</Label>
      <Input value={fabric[field] || ''} onChange={(e) => onChange(field, e.target.value)} className="border-slate-300 bg-white h-9" readOnly={readOnly || disabled} disabled={disabled} />
    </div>
  );
}

export default function InkConsumptionFields({ fabric, index, updateFabric, updateFabricWithTotal, calculateWhiteColorTotal, calculateTopCoatTotal, calculateGrandTotal, readOnly }) {
  const unit = fabric.ink_consumption_unit || 'ml/m²';
  const colorMode = fabric.ink_color_mode || ((fabric.ink_consumption_red || fabric.ink_consumption_green) ? 'CMYKRG' : 'CMYK');
  const binderEnabled = fabric.ink_binder_enabled === true || (!!fabric.ink_consumption_fof_color && fabric.ink_binder_enabled !== false);
  const dtgRelated = fabric.top_coat_dtg_related !== false;
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="text-sm font-semibold text-slate-700">Total Color</Label>
          <div className="flex items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="radio" checked={colorMode === 'CMYK'} onChange={() => updateInk('ink_color_mode', 'CMYK')} disabled={readOnly} />
              CMYK
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={colorMode === 'CMYKRG'} onChange={() => updateInk('ink_color_mode', 'CMYKRG')} disabled={readOnly} />
              CMYKRG
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          {colorBaseFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} />)}
          {colorMode === 'CMYKRG' && colorExtraFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} />)}
          <div className="space-y-1" style={{ minWidth: '90px' }}>
            <Label className="text-xs text-slate-600 font-semibold">Total Color</Label>
            <Input value={calculateWhiteColorTotal(fabric)} className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed" readOnly disabled />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Neon (NP & NY)</Label>
          <div className="flex flex-wrap gap-2 items-end">
            {neonFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} />)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={binderEnabled} onChange={(e) => updateInk('ink_binder_enabled', e.target.checked)} disabled={readOnly} />
            Binder
          </label>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1" style={{ minWidth: '140px' }}>
              <Label className="text-xs text-slate-600">Binder Type</Label>
              <Select value={fabric.ink_binder_type || ''} onValueChange={(value) => updateInk('ink_binder_type', value)} disabled={readOnly || !binderEnabled}>
                <SelectTrigger className="bg-white border-slate-300 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ofix2 (FOF)">Ofix2 (FOF)</SelectItem>
                  <SelectItem value="Inline FOF">Inline FOF</SelectItem>
                  <SelectItem value="Duosoft">Duosoft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field fabric={fabric} field="ink_consumption_fof_color" label="Binder" onChange={updateInk} readOnly={readOnly} disabled={!binderEnabled} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">White & Duratech</Label>
          <div className="flex flex-wrap gap-2 items-end">
            <Field fabric={fabric} field="ink_consumption_white" label="White" onChange={updateInk} readOnly={readOnly} />
            <Field fabric={fabric} field="ink_consumption_fof_white" label="Duratech" onChange={updateInk} readOnly={readOnly} />
          </div>
        </div>
      </div>

      <div className="space-y-2 border border-slate-300 rounded-md p-3 bg-white">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={dtgRelated} onChange={(e) => updateInk('top_coat_dtg_related', e.target.checked)} disabled={readOnly} />
          Top Coat U10, DTG related
        </label>
        <div className="flex flex-wrap gap-2 items-end">
          {topCoatFields.map(([field, label]) => <Field key={field} fabric={fabric} field={field} label={label} onChange={updateInk} readOnly={readOnly} disabled={!dtgRelated} />)}
          <div className="space-y-1" style={{ minWidth: '70px' }}>
            <Label className="text-xs text-slate-600 font-semibold">Total</Label>
            <Input value={dtgRelated ? calculateTopCoatTotal(fabric) : ''} className="border-slate-300 bg-slate-200 h-9 font-semibold cursor-not-allowed" readOnly disabled />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-slate-700">Total Amount of ink</Label>
        <Input value={calculateGrandTotal(fabric) || fabric.ink_consumption_total || ''} className="border-slate-300 bg-slate-200 h-9 font-bold text-lg cursor-not-allowed max-w-28" readOnly disabled />
        <span className="text-sm font-semibold">{unit}</span>
      </div>
    </div>
  );
}