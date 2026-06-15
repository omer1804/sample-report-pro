import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FileText, Loader2, FileDown, Copy, FolderArchive, Upload, Paperclip, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ReportDetailsForm from '../components/reports/ReportDetailsForm';
import FabricsSection from '../components/reports/FabricsSection';
import TestsSection from '../components/reports/TestsSection';
import TestSummaryTable from '../components/reports/TestSummaryTable';
import ImageCaptionUploader from '../components/reports/ImageCaptionUploader';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from '../components/ScrollToTop';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { logActivity } from '@/lib/activityLogger';

export default function CreateReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');
  const isViewMode = urlParams.get('view') === 'true';
  const queryClient = useQueryClient();

  const [details, setDetails] = useState({
    report_name: '',
    customer_name: '',
    task_number: '',
    date_completed: new Date().toISOString().split('T')[0],
    application_engineer: '',
    requestor: '',
    status: 'draft'
  });
  const [fabrics, setFabrics] = useState([]);
  const [tests, setTests] = useState([]);
  const [conclusion, setConclusion] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [generalImages, setGeneralImages] = useState([]);
  const [applicationNoteImages, setApplicationNoteImages] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const [loadingDuplicate, setLoadingDuplicate] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const openedLoggedRef = useRef(false);

  // Load existing report
  const { data: existingReport, refetch: refetchReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const reports = await base44.entities.Report.filter({ id: reportId });
      console.log('Loading report:', reportId, reports);
      return reports[0] || null;
    },
    enabled: !!reportId,
    staleTime: 0,
  });

  const { data: allReports = [] } = useQuery({
    queryKey: ['all-reports-customers'],
    queryFn: () => base44.entities.Report.list(),
    initialData: [],
  });

  const customerOptions = [...new Set(allReports.map(report => report.customer_name).filter(Boolean))].sort();

  // Load tests for this report
  const { data: existingTests = [], refetch: refetchTests } = useQuery({
    queryKey: ['fabric-tests', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const tests = await base44.entities.FabricTest.filter({ report_id: reportId });
      // Sort by order field
      return tests.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    enabled: !!reportId,
    staleTime: 0,
  });

  useEffect(() => {
    if (existingReport) {
      setDetails({
        report_name: existingReport.report_name || '',
        customer_name: existingReport.customer_name || '',
        task_number: existingReport.task_number || '',
        date_completed: existingReport.date_completed,
        application_engineer: existingReport.application_engineer,
        requestor: existingReport.requestor,
        status: existingReport.status
      });
      setFabrics(existingReport.fabrics || []);
      setAttachments(existingReport.attachments || []);
      setGeneralImages(existingReport.general_images || []);
      setApplicationNoteImages(existingReport.application_note_images || []);
      setConclusion(existingReport.conclusion || '');
      if (!openedLoggedRef.current) {
        openedLoggedRef.current = true;
        logActivity('opened', existingReport, isViewMode ? 'Report opened in view mode' : 'Report opened for editing');
      }
    }
  }, [existingReport, isViewMode]);

  useEffect(() => {
    if (existingTests && existingTests.length > 0) {
      const testsData = existingTests.map(test => ({
        id: test.id,  // CRITICAL: Preserve test ID
        fabricIndex: test.fabric_index,
        test_type: test.test_type,
        test_parameters: test.test_parameters,
        result: test.result,
        images_grid: test.images_grid || [],
        grid_columns: test.grid_columns || [],
        row_labels: test.row_labels || [],
        custom_title: test.custom_title || '',
        custom_images: test.custom_images || [],
        test_number: test.test_number || '',
        design_name: test.design_name || '',
        is_internal: !!test.is_internal,
        export_selected: test.export_selected !== false,
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
  }, [details, fabrics, tests, conclusion, attachments, generalImages, applicationNoteImages]);

  const handleSave = async (status = 'draft', silent = false) => {
    if (!details.application_engineer || !details.date_completed) {
      if (!silent) alert('Please fill in required fields: Date and Application Engineer');
      return;
    }

    console.log('=== SAVE STARTING ===');
    console.log('Tests state before save:', tests.map((t, i) => ({
      index: i,
      fabricIndex: t.fabricIndex,
      gridRows: t.images_grid?.length,
      labels: t.row_labels?.length,
      gridData: t.images_grid
    })));

    setSaving(true);
    try {
      const reportData = {
        ...details,
        fabrics,
        attachments,
        general_images: generalImages,
        application_note_images: applicationNoteImages,
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

      // Handle test deletions - delete tests that exist in DB but not in current state
      if (savedReportId) {
        const currentTestIds = tests.filter(t => t.id).map(t => t.id);
        const existingTests = await base44.entities.FabricTest.filter({ report_id: savedReportId });
        for (const existingTest of existingTests) {
          if (!currentTestIds.includes(existingTest.id)) {
            await base44.entities.FabricTest.delete(existingTest.id);
          }
        }
      }

      // Update/create tests based on ID
      if (savedReportId && tests.length > 0) {
        console.log('Saving', tests.length, 'tests');
        for (let i = 0; i < tests.length; i++) {
          const test = tests[i];
          const testData = {
            report_id: savedReportId,
            fabric_index: test.fabricIndex,
            fabric_name: fabrics[test.fabricIndex]?.name || '',
            test_type: test.test_type,
            test_parameters: test.test_parameters,
            result: test.result,
            images_grid: test.images_grid || [],
            grid_columns: test.grid_columns || [],
            row_labels: test.row_labels || [],
            custom_title: test.custom_title || '',
            custom_images: test.custom_images || [],
            test_number: test.test_number || '',
            design_name: test.design_name || '',
            is_internal: !!test.is_internal,
            export_selected: !test.is_internal && test.export_selected !== false,
            notes: test.notes,
            order: i
          };

          if (test.id) {
            // Update existing test - use the preserved ID
            await base44.entities.FabricTest.update(test.id, testData);
          } else {
            // Create new test
            const created = await base44.entities.FabricTest.create(testData);
            // Update state with new ID to prevent duplicate creation
            tests[i].id = created.id;
          }
        }
      }

      setLastSaved(new Date());
      if (!silent) {
        await logActivity('saved', { ...reportData, id: savedReportId }, status === 'completed' ? 'Report completed' : 'Report saved');
      }
      
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
      setLoadingDuplicate(true);
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
            custom_title: test.custom_title,
            custom_images: test.custom_images,
            test_number: test.test_number,
            design_name: test.design_name,
            is_internal: test.is_internal,
            export_selected: test.export_selected,
            notes: test.notes
          });
        }

        await logActivity('duplicate', duplicatedReport, `Duplicated from ${report.report_name || report.task_number || report.id}`);
        window.location.href = createPageUrl('CreateReport') + `?id=${duplicatedReport.id}`;
        } catch (error) {
        alert('Failed to duplicate report');
        setLoadingDuplicate(false);
        }
        }
        };

  const exportReportBackup = async () => {
    if (!reportId) return;
    setLoadingBackup(true);
    try {
      const zip = new JSZip();
      
      // Add JSON backup
      const reportData = {
        report: existingReport,
        tests: existingTests
      };
      zip.file('backup.json', JSON.stringify(reportData, null, 2));
      
      // Add all images with mapping info
      const imageMapping = {};
      
      // Fabric images
      if (existingReport.fabrics) {
        for (let i = 0; i < existingReport.fabrics.length; i++) {
          const fabric = existingReport.fabrics[i];
          if (fabric.images && fabric.images.length > 0) {
            for (let j = 0; j < fabric.images.length; j++) {
              const imgUrl = fabric.images[j];
              const filename = `fabric_${i}_${j}.jpg`;
              imageMapping[imgUrl] = filename;
              const response = await fetch(imgUrl);
              const blob = await response.blob();
              zip.file(`images/${filename}`, blob);
            }
          }
        }
      }
      
      // Test images
      for (let testIdx = 0; testIdx < existingTests.length; testIdx++) {
        const test = existingTests[testIdx];
        if (test.images_grid && test.images_grid.length > 0) {
          for (let rowIdx = 0; rowIdx < test.images_grid.length; rowIdx++) {
            const row = test.images_grid[rowIdx];
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const cell = row[colIdx];
              if (cell.image_url) {
                const filename = `test_${testIdx}_${rowIdx}_${colIdx}.jpg`;
                imageMapping[cell.image_url] = filename;
                const response = await fetch(cell.image_url);
                const blob = await response.blob();
                zip.file(`images/${filename}`, blob);
              }
            }
          }
        }
      }
      
      // Save mapping
      zip.file('image_mapping.json', JSON.stringify(imageMapping, null, 2));
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${existingReport.customer_name || 'Report'}_Backup.zip`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivity('export', existingReport, 'Exported report backup');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to export backup');
    } finally {
      setLoadingBackup(false);
    }
  };

  const importReportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const choice = confirm('Import data WITHOUT images (faster)?\n\nClick OK to skip images, Cancel to import everything (slower)');
    
    setLoadingRestore(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const backupFile = zip.file('backup.json');
      
      if (!backupFile) {
        throw new Error('Invalid backup file - missing backup.json');
      }
      
      const backupText = await backupFile.async('text');
      const data = JSON.parse(backupText);
      
      let updatedFabrics = data.report.fabrics;
      let testsToCreate = data.tests;
      
      if (choice) {
        // Skip images - clear all image references
        updatedFabrics = data.report.fabrics.map(fabric => ({
          ...fabric,
          images: []
        }));
        
        testsToCreate = data.tests.map(test => ({
          ...test,
          images_grid: test.images_grid?.map(row =>
            row.map(cell => ({ ...cell, image_url: '', row_passed: !!cell.row_passed }))
          ) || []
        }));
      } else {
        // Import with images (original logic)
        const mappingFile = zip.file('image_mapping.json');
        const imageMapping = mappingFile ? JSON.parse(await mappingFile.async('text')) : {};
        const urlMapping = {};
        
        const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('images/'));
        for (const imagePath of imageFiles) {
          const imageBlob = await zip.file(imagePath).async('blob');
          const imageFile = new File([imageBlob], imagePath.split('/').pop(), { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
          
          const filename = imagePath.split('/').pop();
          const oldUrl = Object.keys(imageMapping).find(url => imageMapping[url] === filename);
          if (oldUrl) {
            urlMapping[oldUrl] = file_url;
          }
        }
        
        updatedFabrics = data.report.fabrics.map(fabric => ({
          ...fabric,
          images: fabric.images?.map(url => urlMapping[url] || url) || []
        }));
        
        testsToCreate = data.tests.map(test => ({
          ...test,
          images_grid: test.images_grid?.map(row =>
            row.map(cell => ({
              ...cell,
              row_passed: !!cell.row_passed,
              image_url: cell.image_url ? (urlMapping[cell.image_url] || cell.image_url) : ''
            }))
          ) || []
        }));
      }
      
      const { id, created_date, updated_date, created_by, last_saved, ...reportData } = data.report;
      let targetReportId = reportId;
      
      if (reportId) {
        await base44.entities.Report.update(reportId, {
          ...reportData,
          fabrics: updatedFabrics
        });
      } else {
        const newReport = await base44.entities.Report.create({
          ...reportData,
          fabrics: updatedFabrics,
          status: 'draft'
        });
        targetReportId = newReport.id;
      }
      
      for (const test of testsToCreate) {
        await base44.entities.FabricTest.create({
          report_id: targetReportId,
          fabric_index: test.fabric_index,
          fabric_name: test.fabric_name,
          test_type: test.test_type,
          test_parameters: test.test_parameters,
          result: test.result,
          images_grid: test.images_grid,
          grid_columns: test.grid_columns,
          row_labels: test.row_labels,
          notes: test.notes,
          order: test.order
        });
      }
      
      await logActivity('import', { ...reportData, id: targetReportId }, choice ? 'Imported backup without images' : 'Imported backup with images');
      alert(choice ? 'Backup restored successfully (without images)!\n\nYou can now upload images separately.' : 'Backup restored successfully with all images!');
      window.location.href = createPageUrl('CreateReport') + `?id=${targetReportId}`;
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to import backup: ' + error.message);
      setLoadingRestore(false);
      event.target.value = '';
    }
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(prev => [...prev, file_url]);
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const downloadImagesZip = async () => {
    if (!reportId) return;
    setLoadingZip(true);
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

        if (test.custom_images && test.custom_images.length > 0) {
          for (let imgIdx = 0; imgIdx < test.custom_images.length; imgIdx++) {
            const response = await fetch(test.custom_images[imgIdx]);
            const blob = await response.blob();
            testFolder.file(`custom_image_${imgIdx + 1}.jpg`, blob);
          }
        }
      }

      if (report.attachments && report.attachments.length > 0) {
        const attachmentsFolder = zip.folder('Report_Attachments');
        for (let i = 0; i < report.attachments.length; i++) {
          const response = await fetch(report.attachments[i]);
          const blob = await response.blob();
          attachmentsFolder.file(`attachment_${i + 1}`, blob);
        }
      }

      const reportImages = [
        ...(report.general_images || []).map((image, index) => ({ ...image, folder: 'General_Report_Images', name: `general_image_${index + 1}.jpg` })),
        ...(report.application_note_images || []).map((image, index) => ({ ...image, folder: 'Application_Notes_Images', name: `note_image_${index + 1}.jpg` }))
      ];

      for (const image of reportImages) {
        if (image.image_url) {
          const imageFolder = zip.folder(image.folder);
          const response = await fetch(image.image_url);
          const blob = await response.blob();
          imageFolder.file(image.name, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.customer_name || 'Report'}_Images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivity('export', report, 'Downloaded images ZIP');
    } catch (error) {
      console.error('Failed to create zip:', error);
      alert('Failed to download images');
    } finally {
      setLoadingZip(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportId) return;
    setLoadingExcel(true);
    try {
      const report = existingReport;
      const fabricTests = await base44.entities.FabricTest.filter({ report_id: reportId });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Report Info Sheet
      const reportInfo = [
        ['Media DB - Report'],
        [],
        ['Customer Name', report.customer_name || ''],
        ['Task Number', report.task_number || ''],
        ['Date Completed', format(new Date(report.date_completed), 'dd/MM/yyyy')],
        ['Application Engineer', report.application_engineer],
        ['Requestor', report.requestor || ''],
        []
      ];
      
      // Fabrics Info
      reportInfo.push(['Fabrics']);
      report.fabrics?.forEach((fabric, idx) => {
        reportInfo.push(['Fabric Number', fabric.name || '']);
        reportInfo.push(['Material', fabric.material_description || '']);
        reportInfo.push(['Working Point', formatWorkingPoints(fabric)]);
        reportInfo.push(['Machine Model', fabric.machine_model || '']);
        reportInfo.push(['Ink Version', fabric.ink_version || '']);
        reportInfo.push(['Set Up', fabric.setup || '']);
        reportInfo.push(['Resolution', fabric.resolution || '']);
        reportInfo.push(['Ink Consumption Unit', fabric.ink_consumption_unit || 'ml/m²']);
        reportInfo.push(['Ink Consumption - Cyan', fabric.ink_consumption_cyan || '']);
        reportInfo.push(['Ink Consumption - Magenta', fabric.ink_consumption_magenta || '']);
        reportInfo.push(['Ink Consumption - Yellow', fabric.ink_consumption_yellow || '']);
        reportInfo.push(['Ink Consumption - Black', fabric.ink_consumption_black || '']);
        reportInfo.push(['Ink Consumption - Neon Pink', fabric.ink_consumption_neon_pink || fabric.ink_consumption_neon || '']);
        reportInfo.push(['Ink Consumption - Neon Yellow', fabric.ink_consumption_neon_yellow || '']);
        reportInfo.push(['Ink Consumption - Red', fabric.ink_consumption_red || '']);
        reportInfo.push(['Ink Consumption - Green', fabric.ink_consumption_green || '']);
        reportInfo.push(['Ink Consumption - FoF Color', fabric.ink_consumption_fof_color || '']);
        reportInfo.push(['Ink Consumption - White', fabric.ink_consumption_white || '']);
        reportInfo.push(['Ink Consumption - U10 White', fabric.ink_consumption_fof_white || '']);
        reportInfo.push(['Ink Consumption - Total', fabric.ink_consumption_total || '']);
        reportInfo.push(['Curing Time (min)', fabric.curing_time_min || '']);
        reportInfo.push(['Curing Temp (°C)', fabric.curing_temp_celsius || '']);
        reportInfo.push([]);
      });
      
      // Test Results
      reportInfo.push(['Test Results']);
      fabricTests.forEach((test, idx) => {
        reportInfo.push([
          `Test ${idx + 1}`,
          test.fabric_name,
          getTestLabel(test.test_type),
          test.result === 'pass' ? 'Pass' : 'Fail'
        ]);
      });
      
      reportInfo.push([]);
      reportInfo.push(['Application Notes', report.conclusion || '']);
      
      const ws1 = XLSX.utils.aoa_to_sheet(reportInfo);
      XLSX.utils.book_append_sheet(wb, ws1, 'Report Summary');
      
      // Detailed Tests Sheet
      const testDetails = [['Fabric Number', 'Test Type', 'Result', 'Parameters', 'Notes']];
      fabricTests.forEach((test) => {
        const params = Object.entries(test.test_parameters || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        testDetails.push([
          test.fabric_name,
          getTestLabel(test.test_type),
          test.result === 'pass' ? 'Pass' : 'Fail',
          params,
          test.notes || ''
        ]);
      });
      
      const ws2 = XLSX.utils.aoa_to_sheet(testDetails);
      XLSX.utils.book_append_sheet(wb, ws2, 'Test Details');
      
      // Export
      XLSX.writeFile(wb, `${report.customer_name || 'Report'}_MediaDB.xlsx`);
      await logActivity('export', report, 'Exported report Excel');
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export to Excel');
    } finally {
      setLoadingExcel(false);
    }
  };

  function formatWorkingPoints(fabric) {
    const points = [
      ['U', fabric.working_point_q],
      ['QU', fabric.working_point_qu],
      ['W', fabric.working_point_w],
      ['QW', fabric.working_point_qw],
      ...((fabric.working_point_custom || []).map(point => [point.letter || 'Custom', point.value]))
    ].filter(([, value]) => value);
    return points.length > 0 ? points.map(([label, value]) => `${label}: ${value}%`).join(' | ') : (fabric.working_point || '');
  }

  function getTestLabel(testType) {
    const labels = {
      sand_grinding: 'Sand Grinding',
      dry_grinding: 'Dry Grinding',
      wet_grinding: 'Wet Grinding',
      bally_flex_rt: 'Bally Flex Room Temperature',
      bally_flex_minus20: 'Bally Flex -20',
      laundry_test: 'Laundry Test',
      custom: 'Custom Test'
    };
    return labels[testType] || testType;
  }

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
                {reportId ? 'Edit Report' : 'New Report'}
              </h1>
              {lastSaved && (
                <p className="text-sm text-slate-500">
                  Last saved: {format(lastSaved, 'HH:mm:ss')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={importReportBackup}
                  className="hidden"
                  disabled={loadingRestore}
                />
                <Button
                  variant="outline"
                  className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  disabled={loadingRestore}
                >
                  {loadingRestore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Restore
                </Button>
              </label>
              {reportId && (
                <>
                  <Link to={createPageUrl('ViewReportPDF') + `?id=${reportId}&selectedOnly=true`} target="_blank" onClick={() => logActivity('export', existingReport || { id: reportId }, 'Opened selected PDF export')}>
                    <Button variant="outline" className="gap-2">
                      <FileDown className="w-4 h-4" />
                      Export Selected PDF
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    disabled={loadingExcel}
                  >
                    {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadImagesZip}
                    className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    disabled={loadingZip}
                  >
                    {loadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderArchive className="w-4 h-4" />}
                    Download ZIP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportReportBackup}
                    className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    disabled={loadingBackup}
                  >
                    {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Backup
                  </Button>
                  <Button
                    variant="outline"
                    onClick={duplicateReport}
                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    disabled={loadingDuplicate}
                  >
                    {loadingDuplicate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
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
          <ReportDetailsForm details={details} onChange={setDetails} readOnly={isViewMode} customerOptions={customerOptions} />

          <FabricsSection fabrics={fabrics} onChange={setFabrics} tests={tests} onTestsChange={setTests} readOnly={isViewMode} />

          <TestSummaryTable fabrics={fabrics} tests={tests} onTestResultChange={setTests} />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-slate-800">General Report Images</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ImageCaptionUploader
                title="General images that will appear in the PDF report"
                images={generalImages}
                onChange={setGeneralImages}
                readOnly={isViewMode}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Paperclip className="w-5 h-5 text-slate-600" />
                Report Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!isViewMode && (
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50">
                  <input type="file" onChange={handleAttachmentUpload} className="hidden" disabled={uploadingAttachment} />
                  {uploadingAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Add attachment to ZIP
                </label>
              )}
              {attachments.length > 0 && (
                <div className="mt-3 text-sm text-slate-600 flex items-center gap-3">
                  <span>{attachments.length} attachment(s) will be included in ZIP downloads.</span>
                  {!isViewMode && attachments.map((_, index) => (
                    <Button key={index} variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="text-red-600 hover:text-red-700">
                      <X className="w-3 h-3" /> Remove {index + 1}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-slate-800">Application Notes</CardTitle>
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
              <div className="mt-6">
                <ImageCaptionUploader
                  title="Application images with title for export"
                  images={applicationNoteImages}
                  onChange={setApplicationNoteImages}
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