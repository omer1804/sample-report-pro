import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FileText, Loader2, FileDown, Copy, FolderArchive } from 'lucide-react';
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
import JSZip from 'jszip';

export default function CreateReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');
  const isViewMode = urlParams.get('view') === 'true';

  const [details, setDetails] = useState({
    customer_name: '',
    task_number: '',
    date_completed: new Date().toISOString().split('T')[0],
    application_engineer: '',
    report_type: 'sample',
    requestor: '',
    machine_model: '',
    ink_version: '',
    setup: '',
    resolution: '',
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
        task_number: existingReport.task_number || '',
        date_completed: existingReport.date_completed,
        application_engineer: existingReport.application_engineer,
        report_type: existingReport.report_type,
        requestor: existingReport.requestor,
        machine_model: existingReport.machine_model,
        ink_version: existingReport.ink_version,
        setup: existingReport.setup,
        resolution: existingReport.resolution,
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
        status,
        last_saved: new Date().toISOString()
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

  const duplicateReport = async () => {
    if (!reportId) return;
    if (confirm('Duplicate this report?')) {
      try {
        const report = existingReport;
        const { id, created_date, updated_date, created_by, last_saved, ...reportData } = report;
        const duplicatedReport = await base44.entities.Report.create({
          ...reportData,
          customer_name: `${report.customer_name || 'Untitled'} (Copy)`,
          status: 'draft',
          date_completed: new Date().toISOString().split('T')[0],
        });

        const existingTests = await base44.entities.FabricTest.filter({ report_id: reportId });
        for (const test of existingTests) {
          await base44.entities.FabricTest.create({
            report_id: duplicatedReport.id,
            fabric_index: test.fabric_index,
            fabric_name: test.fabric_name,
            test_type: test.test_type,
            test_parameters: test.test_parameters,
            result: test.result,
            images_grid: test.images_grid,
            grid_columns: test.grid_columns,
            row_labels: test.row_labels,
            notes: test.notes
          });
        }

        window.location.href = createPageUrl('CreateReport') + `?id=${duplicatedReport.id}`;
      } catch (error) {
        alert('Failed to duplicate report');
      }
    }
  };

  const downloadImagesZip = async () => {
    if (!reportId) return;
    try {
      const zip = new JSZip();
      const report = existingReport;
      const fabricTests = await base44.entities.FabricTest.filter({ report_id: reportId });
      
      if (report.fabrics) {
        for (let i = 0; i < report.fabrics.length; i++) {
          const fabric = report.fabrics[i];
          if (fabric.images && fabric.images.length > 0) {
            const fabricFolder = zip.folder(`Fabric_${i + 1}_${fabric.name || 'Unnamed'}`);
            for (let j = 0; j < fabric.images.length; j++) {
              const imgUrl = fabric.images[j];
              const response = await fetch(imgUrl);
              const blob = await response.blob();
              fabricFolder.file(`fabric_image_${j + 1}.jpg`, blob);
            }
          }
        }
      }

      for (const test of fabricTests) {
        const fabricName = test.fabric_name || 'Unnamed';
        const testType = test.test_type.replace(/_/g, ' ');
        const testFolder = zip.folder(`Fabric_${test.fabric_index + 1}_${fabricName}/Test_${testType}`);
        
        if (test.images_grid && test.images_grid.length > 0) {
          for (let rowIdx = 0; rowIdx < test.images_grid.length; rowIdx++) {
            const row = test.images_grid[rowIdx];
            const rowLabel = test.row_labels?.[rowIdx] || `Row_${rowIdx + 1}`;
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const cell = row[colIdx];
              if (cell.image_url) {
                const colLabel = test.grid_columns?.[colIdx] || `Col_${colIdx + 1}`;
                const response = await fetch(cell.image_url);
                const blob = await response.blob();
                testFolder.file(`${rowLabel}_${colLabel}.jpg`, blob);
              }
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.customer_name || 'Report'}_Images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create zip:', error);
      alert('Failed to download images');
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
                <>
                  <Link to={createPageUrl('ViewReportPDF') + `?id=${reportId}`} target="_blank">
                    <Button variant="outline" className="gap-2">
                      <FileDown className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={downloadImagesZip}
                    className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <FolderArchive className="w-4 h-4" />
                    Download ZIP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={duplicateReport}
                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </Button>
                </>
              )}
              {!isViewMode && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6 pb-24">
          <ReportDetailsForm details={details} onChange={setDetails} readOnly={isViewMode} />

          <FabricsSection fabrics={fabrics} onChange={setFabrics} tests={tests} onTestsChange={setTests} readOnly={isViewMode} />

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
                  readOnly={isViewMode}
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