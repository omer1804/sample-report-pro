import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function AdminAnalyticsArea({ title, fields, rows, edits, updateCell, saveRow, savingKey, showImages = false }) {
  return <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent><div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead><tr className="bg-muted">
          {showImages && <th className="border p-2 text-left">Design image</th>}
          {fields.map(([, label]) => <th key={label} className="border p-2 text-left">{label}</th>)}
          <th className="border p-2">Save</th>
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.row_key}>
          {showImages && <td className="border p-2 min-w-32">{row.design_image ? <a href={row.design_image} target="_blank" rel="noreferrer"><img src={row.design_image} alt={`Design for ${row.fabric_name}`} className="w-28 h-24 object-contain" loading="lazy" /></a> : <span className="text-muted-foreground">No image</span>}</td>}
          {fields.map(([field, , readOnly]) => <td key={field} className="border p-1"><Textarea rows={2} className="min-w-20 text-xs resize-y" value={edits[row.row_key]?.[field] ?? row[field] ?? ''} readOnly={readOnly} onChange={e => updateCell(row.row_key, field, e.target.value)} /></td>)}
          <td className="border p-1"><Button size="sm" onClick={() => saveRow(row)} disabled={savingKey === row.row_key}><Save className="w-3 h-3" />{savingKey === row.row_key ? 'Saving...' : 'Save'}</Button></td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="text-center text-muted-foreground py-6">No matching fabric data.</p>}
    </div></CardContent>
  </Card>;
}