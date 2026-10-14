import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function AdminDesignDetails({ fields, rows, edits, updateCell, saveRow, savingKey }) {
  return <Card>
    <CardHeader><CardTitle>Design, Ink & Fabric Details</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {rows.map(row => <div key={row.row_key} className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold break-words">{(edits[row.row_key]?.fabric_name ?? row.fabric_name) || 'Unnamed fabric'}</h3>
          <Button size="sm" onClick={() => saveRow(row)} disabled={savingKey === row.row_key}><Save className="w-3 h-3" />{savingKey === row.row_key ? 'Saving...' : 'Save'}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Design image</Label>{row.design_image ? <a href={row.design_image} target="_blank" rel="noreferrer"><img src={row.design_image} alt={`Design for ${row.fabric_name}`} className="w-full h-40 object-contain rounded border" loading="lazy" /></a> : <p className="text-sm text-muted-foreground">No image</p>}</div>
          {fields.map(([field, label, readOnly]) => <div key={field} className={`space-y-2 min-w-0 ${field === 'ink_consumption' ? 'md:col-span-2' : ''}`}>
            <Label htmlFor={`${row.row_key}-${field}`}>{label}</Label>
            <Textarea id={`${row.row_key}-${field}`} className="text-sm resize-y" rows={field === 'ink_consumption' ? 7 : 2} value={edits[row.row_key]?.[field] ?? row[field] ?? ''} readOnly={readOnly} onChange={e => updateCell(row.row_key, field, e.target.value)} />
          </div>)}
        </div>
      </div>)}
      {!rows.length && <p className="text-center text-muted-foreground py-6">No matching fabric data.</p>}
    </CardContent>
  </Card>;
}