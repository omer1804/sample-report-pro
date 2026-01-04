import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ViewReportPDF() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const reports = await base44.entities.Report.filter({ id: reportId });
      return reports[0] || null;
    },
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['fabric-tests', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      return await base44.entities.FabricTest.filter({ report_id: reportId });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden in print */}
      <div className="no-print bg-slate-100 p-4 border-b flex justify-between items-center">
        <Link to={createPageUrl('CreateReport') + `?id=${reportId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </Button>
        </Link>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Report Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold mb-2">Sample Durability Test Report</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {report.customer_name && <div><strong>Customer:</strong> {report.customer_name}</div>}
            <div><strong>Date Completed:</strong> {format(new Date(report.date_completed), 'dd/MM/yy')}</div>
            <div><strong>Application Engineer:</strong> {report.application_engineer}</div>
            <div><strong>Type:</strong> {report.report_type === 'demo' ? '☐ Demo ☒ Sample' : '☒ Demo ☐ Sample'}</div>
            <div><strong>Requestor:</strong> {report.requestor || '-'}</div>
            <div><strong>Machine Model:</strong> {report.machine_model || '-'}</div>
            <div><strong>Ink Version:</strong> {report.ink_version || '-'}</div>
            <div><strong>Set Up:</strong> {report.setup || '-'}</div>
            <div><strong>Resolution:</strong> {report.resolution || '-'}</div>
            <div><strong>Curing Time:</strong> {report.curing_time_min ? `${report.curing_time_min} min` : '-'}</div>
            <div><strong>Curing Temp:</strong> {report.curing_temp_celsius ? `${report.curing_temp_celsius}°C` : '-'}</div>
            <div><strong>Working Point:</strong> {report.working_point || '-'}</div>
          </div>
        </div>

        {/* Materials */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Material:</h2>
          <div className="space-y-4">
            {report.fabrics?.map((fabric, idx) => (
              <div key={idx}>
                <p className="font-semibold">{idx + 1}. {fabric.name}</p>
                <p className="text-sm">{fabric.material_description}</p>
                {fabric.images && fabric.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {fabric.images.map((img, imgIdx) => (
                      <img key={imgIdx} src={img} alt={`${fabric.name}`} className="h-48 object-contain border" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Tables */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Test Summary</h2>
          <div className="flex gap-4 flex-wrap">
            {report.fabrics?.map((fabric, fabricIdx) => {
              const fabricTests = tests.filter(t => t.fabric_index === fabricIdx);
              if (fabricTests.length === 0) return null;
              
              return (
                <table key={fabricIdx} className="border-collapse border border-slate-400">
                  <thead>
                    <tr>
                      <th className="border border-slate-400 px-4 py-2 bg-slate-100 text-sm" colSpan="2">
                        {fabric.name || `Fabric ${fabricIdx + 1}`}
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-slate-400 px-4 py-2 bg-slate-50 text-xs">Test</th>
                      <th className="border border-slate-400 px-4 py-2 bg-slate-50 text-xs">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabricTests.map((test, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-400 px-4 py-1 text-xs">{getTestLabel(test.test_type)}</td>
                        <td 
                          className="border border-slate-400 px-4 py-1 text-xs font-semibold text-center text-white"
                          style={{backgroundColor: test.result === 'pass' ? '#22c55e' : '#ef4444'}}
                        >
                          {test.result === 'pass' ? 'Pass' : 'Fail'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
          </div>
        </div>

        {/* Tests */}
        {report.fabrics?.map((fabric, fabricIdx) => {
          const fabricTests = tests.filter(t => t.fabric_index === fabricIdx);
          
          return fabricTests.map((test, testIdx) => {
            const columns = test.grid_columns && test.grid_columns.length > 0 
              ? test.grid_columns 
              : getDefaultColumns(test.test_type);
            const rowLabels = test.row_labels && test.row_labels.length > 0
              ? test.row_labels
              : ['Area A', 'Area B', 'Area C'];

            return (
              <div key={`${fabricIdx}-${testIdx}`} className="mb-12 page-break">
                <h2 className="text-lg font-bold mb-2">Fabric {fabricIdx + 1}: {fabric.name}</h2>
                <h3 className="text-md font-semibold mb-4" style={{backgroundColor: '#ffff00', display: 'inline-block', padding: '2px 8px'}}>
                  Test {fabricIdx + 1}.{testIdx + 1}: {getTestLabel(test.test_type)}
                </h3>

              {/* Test Grid */}
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="border border-slate-400 p-1 text-xs bg-slate-100"></th>
                    {columns.map((col, idx) => (
                      <th key={idx} className="border border-slate-400 p-1 text-xs bg-slate-100">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {test.images_grid?.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="border border-slate-400 p-1 text-xs font-semibold bg-slate-50">
                        {rowLabels[rowIdx] || `Row ${rowIdx + 1}`}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td 
                          key={colIdx} 
                          className="border p-1"
                          style={{
                            borderWidth: cell.is_selected ? '3px' : '1px',
                            borderColor: cell.is_selected ? '#ef4444' : '#94a3b8',
                            width: '150px',
                            height: '150px'
                          }}
                        >
                          {cell.image_url && (
                            <img 
                              src={cell.image_url} 
                              alt="" 
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Test Parameters */}
              <div className="border border-slate-400 inline-block">
                <table className="text-sm">
                  <tbody>
                    {test.test_parameters?.pressure && (
                      <tr><td className="border border-slate-400 px-3 py-1 font-semibold bg-slate-100 text-center" colSpan="2">{getTestLabel(test.test_type)}</td></tr>
                    )}
                    {test.test_parameters?.pressure && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.pressure}</td></tr>
                    )}
                    {test.test_parameters?.sample_size && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.sample_size}</td></tr>
                    )}
                    {test.test_parameters?.revolutions && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.revolutions}</td></tr>
                    )}
                    {test.test_parameters?.checkpoint && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.checkpoint}</td></tr>
                    )}
                    <tr>
                      <td 
                        className="border border-slate-400 px-3 py-1 font-semibold text-center text-white"
                        style={{backgroundColor: test.result === 'pass' ? '#22c55e' : '#ef4444'}}
                      >
                        {test.result === 'pass' ? 'Pass' : 'Fail'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {test.notes && (
                <div className="mt-3">
                  <p className="text-sm">• {test.notes}</p>
                </div>
              )}
              </div>
            );
          });
        })}

        {/* Conclusion */}
        {report.conclusion && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Conclusion</h2>
            <div className="whitespace-pre-wrap text-sm">{report.conclusion}</div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

function getTestLabel(testType) {
  const labels = {
    sand_grinding: 'Sand Grinding',
    dry_grinding: 'Dry Grinding',
    wet_grinding: 'Wet Grinding',
    bally_flex_rt: 'Bally Flex Room Temperature',
    bally_flex_minus20: 'Bally Flex -20'
  };
  return labels[testType] || testType;
}

function getDefaultColumns(testType) {
  switch (testType) {
    case 'sand_grinding':
      return ['REF', '10', '20', '30', '40', '50'];
    case 'dry_grinding':
      return ['REF', '5K', '10K', '15K', '20K', '25K', '30K'];
    case 'wet_grinding':
      return ['REF', '4K', '8K', '12K'];
    case 'bally_flex_rt':
      return ['REF', '50K', '100K', '150K'];
    case 'bally_flex_minus20':
      return ['REF', '40K'];
    default:
      return ['REF'];
  }
}