import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Lock, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ADMIN_PASSWORD = 'Aa123456!';
const fields = [
  ['fabric_name', 'FABRIC NAME'],
  ['sku_number', 'NUMBER (SKU)'],
  ['design_with_ink_consumption', 'DESGIN WITH INK CONSMPTION'],
  ['fabric_composite', 'Fabric Composite'],
  ['setup', 'Setup'],
  ['value', 'Value'],
  ['wash', 'Wash'],
  ['jiss', 'Jiss'],
  ['ball_flex', 'Ball Flex'],
  ['printability', 'Printability'],
  ['approval_bkm', 'Approval / BKM']
];

export default function AdminBackend() {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(sessionStorage.getItem('adminBackendAuthorized') === 'true');
  const [edits, setEdits] = useState({});
  const [savingKey, setSavingKey] = useState('');

  const { data: reports = [] } = useQuery({ queryKey: ['admin-reports'], queryFn: () => base44.entities.Report.list('-updated_date') });
  const { data: tests = [] } = useQuery({ queryKey: ['admin-tests'], queryFn: () => base44.entities.FabricTest.list('-updated_date') });
  const { data: notes = [], refetch: refetchNotes } = useQuery({ queryKey: ['fabric-analytics-notes'], queryFn: () => base44.entities.FabricAnalyticsNote.list() });
  const { data: logs = [] } = useQuery({ queryKey: ['activity-logs'], queryFn: () => base44.entities.ActivityLog.list('-performed_at', 200) });

  const notesByKey = useMemo(() => Object.fromEntries(notes.map(note => [note.row_key, note])), [notes]);
  const rows = useMemo(() => reports.flatMap(report => (report.fabrics || []).map((fabric, index) => {
    const key = `${report.id}_${index}`;
    const fabricTests = tests.filter(test => test.report_id === report.id && test.fabric_index === index);
    const note = notesByKey[key] || {};
    const getResult = (name) => fabricTests.find(test => test.test_type === name)?.result || '';
    return {
      row_key: key,
      report_id: report.id,
      fabric_index: index,
      fabric_name: note.fabric_name || fabric.name || '',
      sku_number: note.sku_number || report.task_number || '',
      design_with_ink_consumption: note.design_with_ink_consumption || [fabricTests.map(test => test.design_name).filter(Boolean).join(', '), fabric.ink_consumption_total ? `${fabric.ink_consumption_total} ${fabric.ink_consumption_unit || 'ml/m²'}` : ''].filter(Boolean).join(' / '),
      fabric_composite: note.fabric_composite || fabric.material_description || '',
      setup: note.setup || fabric.setup || '',
      value: note.value || formatWorkingPoints(fabric),
      wash: note.wash || getResult('laundry_test'),
      jiss: note.jiss || [getResult('sand_grinding'), getResult('dry_grinding'), getResult('wet_grinding')].filter(Boolean).join(', '),
      ball_flex: note.ball_flex || [getResult('bally_flex_rt'), getResult('bally_flex_minus20')].filter(Boolean).join(', '),
      printability: note.printability || '',
      approval_bkm: note.approval_bkm || '',
      source_note_id: note.id || ''
    };
  })), [reports, tests, notesByKey]);

  const recentLogs = logs.filter(log => new Date(log.performed_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminBackendAuthorized', 'true');
      setAuthorized(true);
    } else {
      alert('Wrong password');
    }
  };

  const updateCell = (rowKey, field, value) => setEdits(prev => ({ ...prev, [rowKey]: { ...(prev[rowKey] || {}), [field]: value } }));

  const saveRow = async (row) => {
    setSavingKey(row.row_key);
    const data = { ...row, ...(edits[row.row_key] || {}) };
    const payload = Object.fromEntries(fields.map(([field]) => [field, data[field] || '']));
    payload.row_key = row.row_key;
    payload.report_id = row.report_id;
    payload.fabric_index = row.fabric_index;
    if (row.source_note_id) {
      await base44.entities.FabricAnalyticsNote.update(row.source_note_id, payload);
    } else {
      await base44.entities.FabricAnalyticsNote.create(payload);
    }
    setEdits(prev => ({ ...prev, [row.row_key]: undefined }));
    await refetchNotes();
    setSavingKey('');
  };

  const exportAnalytics = () => {
    const data = rows.map(row => Object.fromEntries(fields.map(([field, label]) => [label, (edits[row.row_key]?.[field] ?? row[field]) || ''])));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Fabric Analytics');
    XLSX.writeFile(wb, 'Fabric_Test_Analytics.xlsx');
  };

  const exportLogs = () => {
    const data = recentLogs.map(log => ({ Time: log.performed_at, Action: log.action, Report: log.report_name, Customer: log.customer_name, Details: log.details }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), '30 Day Log');
    XLSX.writeFile(wb, 'Activity_Log_30_Days.xlsx');
  };

  if (!authorized) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><Card className="w-full max-w-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Admin Backend</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} /></div><Button onClick={login} className="w-full">Enter</Button><Link to="/Reports"><Button variant="ghost" className="w-full">Back</Button></Link></CardContent></Card></div>;
  }

  return <div className="min-h-screen bg-slate-50 p-6"><div className="max-w-7xl mx-auto space-y-6"><div className="flex items-center justify-between"><div><Link to="/Reports"><Button variant="ghost" className="gap-2 mb-2"><ArrowLeft className="w-4 h-4" /> Back to Reports</Button></Link><h1 className="text-3xl font-bold text-slate-900">Admin Backend</h1><p className="text-slate-600">Activity log and fabric/test analytics.</p></div><Button variant="outline" onClick={() => { sessionStorage.removeItem('adminBackendAuthorized'); setAuthorized(false); }}>Lock</Button></div><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>30 Day App Log</CardTitle><Button variant="outline" onClick={exportLogs} className="gap-2"><Download className="w-4 h-4" /> Export Log</Button></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Time</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Report</th><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Details</th></tr></thead><tbody>{recentLogs.map(log => <tr key={log.id} className="border-b"><td className="p-2 whitespace-nowrap">{new Date(log.performed_at).toLocaleString()}</td><td className="p-2"><Badge>{log.action}</Badge></td><td className="p-2">{log.report_name}</td><td className="p-2">{log.customer_name}</td><td className="p-2">{log.details}</td></tr>)}</tbody></table>{recentLogs.length === 0 && <p className="text-center text-slate-500 py-6">No logged activity yet.</p>}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fabric & Test Analytics</CardTitle><Button onClick={exportAnalytics} className="gap-2"><Download className="w-4 h-4" /> Export Table</Button></CardHeader><CardContent><div className="overflow-x-auto"><table className="text-xs border-collapse min-w-full"><thead><tr className="bg-slate-100">{fields.map(([, label]) => <th key={label} className="border p-2 text-left min-w-40">{label}</th>)}<th className="border p-2">Save</th></tr></thead><tbody>{rows.map(row => <tr key={row.row_key}>{fields.map(([field]) => <td key={field} className="border p-1"><Input className="h-8 text-xs" value={edits[row.row_key]?.[field] ?? row[field] ?? ''} onChange={(e) => updateCell(row.row_key, field, e.target.value)} /></td>)}<td className="border p-1"><Button size="sm" onClick={() => saveRow(row)} disabled={savingKey === row.row_key} className="gap-1"><Save className="w-3 h-3" /> Save</Button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="text-center text-slate-500 py-6">No fabric data yet.</p>}</div></CardContent></Card></div></div>;
}

function formatWorkingPoints(fabric) {
  const points = [
    ['U', fabric.working_point_q],
    ['QU', fabric.working_point_qu],
    ['W', fabric.working_point_w],
    ['QW', fabric.working_point_qw],
    ...((fabric.working_point_custom || []).map(point => [point.letter || 'Custom', point.value]))
  ].filter(([, value]) => value);
  return points.length ? points.map(([label, value]) => `${label}: ${value}%`).join(' | ') : (fabric.working_point || '');
}