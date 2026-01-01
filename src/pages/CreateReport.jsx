import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FileText, Loader2, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ReportDetailsForm from '../components/reports/ReportDetailsForm';
import FabricsSection from '../components/reports/FabricsSection';
import TestsSection from '../components/reports/TestsSection';
import TestSummaryTable from '../components/reports/TestSummaryTable';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from '../components/ScrollToTop';

export default function CreateReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const [details, setDetails] = useState({
    customer_name: '',
    date_completed: new Date().toISOString().split('T')[0],
    application_engineer: '',
    report_type: 'sample',
    requestor: '',
    machine_model: '',
    ink_version: '',
    setup: '',
    resolution: '',
    curing_time_min: null,
    curing_temp_celsius: null,
    working_point: '',
    status: 'draft'
  });
  const [fabrics, setFabrics] = useState([]);
  const [tests, setTests] = useState([]);
  const [conclusion, setConclusion] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Load existing report
  const { data: existingReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const reports = await base44.entities.Report.filter({ id: reportId });
      return reports[0] || null;
    },
    enabled: !!reportId,
  });

  // Load tests for this report
  const { data: existingTests = [] } = useQuery({
    queryKey: ['fabric-tests', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      return await base44.entities.FabricTest.filter({ report_id: reportId });
    },
    enabled: !!reportId,
  });

  useEffect(() => {
    if (existingReport) {
      setDetails({
        customer_name: existingReport.customer_name || '',
        date_completed: existingReport.date_completed,
        application_engineer: existingReport.application_engineer,
        report_type: existingReport.report_type,
        requestor: existingReport.requestor,
        machine_model: existingReport.machine_model,
        ink_version: existingReport.ink_version,
        setup: existingReport.setup,
        resolution: existingReport.resolution,
        curing_time_min: existingReport.curing_time_min,
        curing_temp_celsius: existingReport.curing_temp_celsius,
        working_point: existingReport.working_point,
        status: existingReport.status
      });
      setFabrics(existingReport.fabrics || []);
      setConclusion(existingReport.conclusion || '');
    }
  }, [existingReport]);

  useEffect(() => {
    if (existingTests.length > 0) {
      const testsData = existingTests.map(test => ({
        fabricIndex: test.fabric_index,
        test_type: test.test_type,
        test_parameters: test.test_parameters,
        result: test.result,
        images_grid: test.images_grid,
        grid_columns: test.grid_columns || [],
        row_labels: test.row_labels || [],
        notes: test.notes
      }));
      setTests(testsData);
    }
  }, [existingTests]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (details.application_engineer && details.date_completed) {
        handleSave('draft', true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [details, fabrics, tests, conclusion]);

  const handleSave = async (status = 'draft', silent = false) => {
    if (!details.application_engineer || !details.date_completed) {
      if (!silent) alert('Please fill in required fields: Date and Application Engineer');
      return;
    }

    setSaving(true);
    try {
      const reportData = {
        ...details,
        fabrics,
        conclusion,
        status
      };

      let savedReportId = reportId;
      
      if (reportId) {
        await base44.entities.Report.update(reportId, reportData);
      } else {
        const newReport = await base44.entities.Report.create(reportData);
        savedReportId = newReport.id;
        window.history.replaceState({}, '', `${createPageUrl('CreateReport')}?id=${savedReportId}`);
      }

      // Delete existing tests and recreate
      if (savedReportId) {
        const existingTests = await base44.entities.FabricTest.filter({ report_id: savedReportId });
        for (const test of existingTests) {
          await base44.entities.FabricTest.delete(test.id);
        }

        // Save new tests
        for (const test of tests) {
          await base44.entities.FabricTest.create({
            report_id: savedReportId,
            fabric_index: test.fabricIndex,
            fabric_name: fabrics[test.fabricIndex]?.name || '',
            test_type: test.test_type,
            test_parameters: test.test_parameters,
            result: test.result,
            images_grid: test.images_grid,
            grid_columns: test.grid_columns || [],
            row_labels: test.row_labels || [],
            notes: test.notes
          });
        }
      }

      setLastSaved(new Date());
      if (!silent) {
        alert(`Report ${status === 'completed' ? 'completed' : 'saved'} successfully!`);
        if (status === 'completed') {
          window.location.href = createPageUrl('Reports');
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      if (!silent) alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Reports')}>
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                {reportId ? 'Edit Report' : 'New Sample Report'}
              </h1>
              {lastSaved && (
                <p className="text-sm text-slate-500">
                  Last saved: {format(lastSaved, 'HH:mm:ss')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {reportId && (
                <Link to={createPageUrl('ViewReportPDF') + `?id=${reportId}`} target="_blank">
                  <Button variant="outline" className="gap-2">
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => handleSave('in_progress')}
                variant="outline"
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave('completed')}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <FileText className="w-4 h-4" />
                Complete Report
              </Button>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6 pb-24">
          <ReportDetailsForm details={details} onChange={setDetails} />

          <FabricsSection fabrics={fabrics} onChange={setFabrics} tests={tests} onTestsChange={setTests} />

          <TestSummaryTable fabrics={fabrics} tests={tests} onTestResultChange={setTests} />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-slate-800">Conclusion</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Final Notes & Recommendations</Label>
                <Textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Enter conclusion and recommendations..."
                  className="border-slate-300 min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        </div>

        <ScrollToTop />
        </div>
        );
        }