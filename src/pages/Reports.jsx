import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Eye, Trash2, FileDown, Search, Copy, FolderArchive, Pencil, Database, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('-date_completed'); // newest first
  const [exportingAll, setExportingAll] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', sortOrder],
    queryFn: () => base44.entities.Report.list(sortOrder),
  });

  const deleteReport = async (id) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await base44.entities.Report.delete(id);
      window.location.reload();
    }
  };

  const duplicateReport = async (report) => {
    if (confirm('Duplicate this report?')) {
      try {
        // Create duplicate report (exclude id, created_date, updated_date, created_by)
        const { id, created_date, updated_date, created_by, last_saved, ...reportData } = report;
        const duplicatedReport = await base44.entities.Report.create({
          ...reportData,
          customer_name: `${report.customer_name || 'Untitled'} (Copy)`,
          status: 'draft',
          date_completed: new Date().toISOString().split('T')[0],
        });

        // Duplicate tests
        const tests = await base44.entities.FabricTest.filter({ report_id: report.id });
        for (const test of tests) {
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

        // Navigate to the duplicated report
        window.location.href = createPageUrl('CreateReport') + `?id=${duplicatedReport.id}`;
      } catch (error) {
        console.error('Duplication error:', error);
        alert('Failed to duplicate report');
      }
    }
  };

  const downloadImagesZip = async (report) => {
    try {
      const zip = new JSZip();
      const tests = await base44.entities.FabricTest.filter({ report_id: report.id });
      
      // Add fabric images
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

      // Add test images
      for (const test of tests) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.customer_name?.toLowerCase().includes(query) ||
      report.application_engineer?.toLowerCase().includes(query) ||
      report.requestor?.toLowerCase().includes(query) ||
      report.machine_model?.toLowerCase().includes(query)
    );
  });

  const exportAllToExcel = async () => {
    setExportingAll(true);
    try {
      const allReportsData = await Promise.all(
        reports.map(async (report) => {
          const tests = await base44.entities.FabricTest.filter({ report_id: report.id });
          return { report, tests };
        })
      );

      const wb = XLSX.utils.book_new();
      
      // Main Database Sheet - One row per report
      const dbData = [
        [
          'Report ID',
          'Customer Name',
          'Task Number',
          'Date Completed',
          'Application Engineer',
          'Report Type',
          'Requestor',
          'Machine Model',
          'Ink Version',
          'Setup',
          'Resolution',
          'Status',
          'Number of Fabrics',
          'Total Tests',
          'Tests Passed',
          'Tests Failed',
          'Conclusion'
        ]
      ];

      allReportsData.forEach(({ report, tests }) => {
        const passedTests = tests.filter(t => t.result === 'pass').length;
        const failedTests = tests.filter(t => t.result === 'fail').length;
        
        dbData.push([
          report.id,
          report.customer_name || '',
          report.task_number || '',
          report.date_completed ? format(new Date(report.date_completed), 'yyyy-MM-dd') : '',
          report.application_engineer || '',
          report.report_type || '',
          report.requestor || '',
          report.machine_model || '',
          report.ink_version || '',
          report.setup || '',
          report.resolution || '',
          report.status || '',
          report.fabrics?.length || 0,
          tests.length,
          passedTests,
          failedTests,
          report.conclusion || ''
        ]);
      });

      const ws1 = XLSX.utils.aoa_to_sheet(dbData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Reports Database');

      // Fabrics Sheet - One row per fabric
      const fabricData = [
        [
          'Report ID',
          'Customer Name',
          'Fabric Index',
          'Fabric Name',
          'Material Description',
          'Working Point',
          'Ink Consumption - Total',
          'Ink Consumption - Color',
          'Ink Consumption - White',
          'Ink Consumption - Functional',
          'Curing Time (min)',
          'Curing Temp (°C)'
        ]
      ];

      allReportsData.forEach(({ report }) => {
        report.fabrics?.forEach((fabric, idx) => {
          fabricData.push([
            report.id,
            report.customer_name || '',
            idx + 1,
            fabric.name || '',
            fabric.material_description || '',
            fabric.working_point || '',
            fabric.ink_consumption_total || '',
            fabric.ink_consumption_color || '',
            fabric.ink_consumption_white || '',
            fabric.ink_consumption_functional || '',
            fabric.curing_time_min || '',
            fabric.curing_temp_celsius || ''
          ]);
        });
      });

      const ws2 = XLSX.utils.aoa_to_sheet(fabricData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Fabrics Database');

      // Tests Sheet - One row per test
      const testData = [
        [
          'Report ID',
          'Customer Name',
          'Fabric Name',
          'Test Type',
          'Result',
          'Pressure',
          'Sample Size',
          'Revolutions',
          'Checkpoint',
          'Notes'
        ]
      ];

      allReportsData.forEach(({ report, tests }) => {
        tests.forEach((test) => {
          testData.push([
            report.id,
            report.customer_name || '',
            test.fabric_name || '',
            test.test_type || '',
            test.result || '',
            test.test_parameters?.pressure || '',
            test.test_parameters?.sample_size || '',
            test.test_parameters?.revolutions || '',
            test.test_parameters?.checkpoint || '',
            test.notes || ''
          ]);
        });
      });

      const ws3 = XLSX.utils.aoa_to_sheet(testData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Tests Database');

      XLSX.writeFile(wb, `MediaDB_AllReports_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export database');
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Sample Reports</h1>
              <p className="text-slate-600">Textile printing durability test reports</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportAllToExcel}
                variant="outline"
                className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                disabled={exportingAll || !reports || reports.length === 0}
              >
                {exportingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Export All to Excel
              </Button>
              <Link to={createPageUrl('CreateReport')}>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg">
                  <Plus className="w-5 h-5" />
                  New Report
                </Button>
              </Link>
            </div>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer, engineer, requestor, machine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-date_completed">Newest First</SelectItem>
                <SelectItem value="date_completed">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            </div>
            </div>

        {/* Reports Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No reports yet</h3>
              <p className="text-slate-500 mb-6">Create your first sample report to get started</p>
              <Link to={createPageUrl('CreateReport')}>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Plus className="w-5 h-5" />
                  Create Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No reports found</h3>
              <p className="text-slate-500">Try adjusting your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow border-slate-200">
                <CardContent className="p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 h-8">
                    <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <Badge className={`${getStatusColor(report.status)} border`}>
                      {report.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {report.customer_name || 'Untitled Customer'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-1">
                    {format(new Date(report.date_completed), 'MMM dd, yyyy')}
                  </p>
                  {report.last_saved && (
                    <p className="text-xs text-slate-400 mb-3">
                      Last saved: {format(new Date(report.last_saved), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                  
                  <div className="space-y-1 text-sm text-slate-600 mb-4">
                    {report.application_engineer && (
                      <p><span className="font-medium">Engineer:</span> {report.application_engineer}</p>
                    )}
                    {report.requestor && (
                      <p><span className="font-medium">Requestor:</span> {report.requestor}</p>
                    )}
                    {report.fabrics && report.fabrics.length > 0 && (
                      <p><span className="font-medium">Fabrics:</span> {report.fabrics.length}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={createPageUrl('CreateReport') + `?id=${report.id}&view=true`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Link to={createPageUrl('CreateReport') + `?id=${report.id}`}>
                      <Button variant="outline" size="icon" title="Edit Report">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl('ViewReportPDF') + `?id=${report.id}`} target="_blank">
                      <Button variant="outline" size="icon" title="Export PDF">
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => downloadImagesZip(report)}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                      title="Download images as ZIP"
                    >
                      <FolderArchive className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => duplicateReport(report)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      title="Duplicate report"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReport(report.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}