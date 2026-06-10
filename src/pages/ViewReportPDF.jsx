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
  const selectedOnly = urlParams.get('selectedOnly') === 'true';

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

  const exportTests = tests.filter(test => !test.is_internal && (!selectedOnly || test.export_selected !== false));

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
          <h1 className="text-2xl font-bold mb-2">Durability Test Report</h1>
          {report.report_name && <div className="text-lg font-semibold mb-3">{report.report_name}</div>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {report.customer_name && <div><strong>Customer:</strong> {report.customer_name}</div>}
            {report.task_number && <div><strong>Task Number:</strong> {report.task_number}</div>}
            <div><strong>Date Completed:</strong> {format(new Date(report.date_completed), 'dd/MM/yy')}</div>
            {report.last_saved && <div><strong>Last Saved:</strong> {format(new Date(report.last_saved), 'dd/MM/yy HH:mm')}</div>}
            <div><strong>Application Engineer:</strong> {report.application_engineer}</div>
            <div><strong>Requestor:</strong> {report.requestor || '-'}</div>
          </div>
        </div>

        {/* Materials */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Material:</h2>
          <div className="space-y-4">
            {report.fabrics?.map((fabric, idx) => (
              <div key={idx}>
                <p className="font-semibold">Fabric Number {fabric.name || String(idx + 1).padStart(3, '0')}</p>
                <p className="text-sm">{fabric.material_description}</p>
                <div className="text-sm mt-1 space-y-1">
                  {fabric.working_point && <p><strong>Working Point:</strong> {fabric.working_point}</p>}
                  {(fabric.machine_model || report.machine_model) && <p><strong>Machine Model:</strong> {fabric.machine_model || report.machine_model}</p>}
                  {(fabric.ink_version || report.ink_version) && <p><strong>Ink Version:</strong> {fabric.ink_version || report.ink_version}</p>}
                  {(fabric.setup || report.setup) && <p><strong>Set Up:</strong> {fabric.setup || report.setup}</p>}
                  {(fabric.resolution || report.resolution) && <p><strong>Resolution:</strong> {fabric.resolution || report.resolution}</p>}
                  {fabric.curing_time_min && <p><strong>Curing Time:</strong> {fabric.curing_time_min} min</p>}
                  {fabric.curing_temp_celsius && <p><strong>Curing Temp:</strong> {fabric.curing_temp_celsius}°C</p>}
                </div>

                {/* Ink Consumption Table */}
                <div className="mt-3">
                  <table className="border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-2 py-1" colSpan="9">Ink Consumption (ml)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Cyan</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Magenta</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Yellow</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Black</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Neon</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">FoF Color</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">White</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">FoF White</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Total</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_cyan || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_magenta || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_yellow || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_black || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_neon || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_fof_color || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_white || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_fof_white || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold">{(() => {
                          const sum = [
                            parseFloat(fabric.ink_consumption_cyan || 0),
                            parseFloat(fabric.ink_consumption_magenta || 0),
                            parseFloat(fabric.ink_consumption_yellow || 0),
                            parseFloat(fabric.ink_consumption_black || 0),
                            parseFloat(fabric.ink_consumption_neon || 0),
                            parseFloat(fabric.ink_consumption_fof_color || 0),
                            parseFloat(fabric.ink_consumption_white || 0),
                            parseFloat(fabric.ink_consumption_fof_white || 0)
                          ].reduce((a, b) => a + b, 0);
                          return sum > 0 ? sum.toFixed(2) : '-';
                        })()}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1" colSpan="9"></td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">U10</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">FoF White Top Coat</td>
                        <td className="border border-slate-400 px-2 py-1 font-semibold bg-slate-50">Total</td>
                        <td className="border border-slate-400 px-2 py-1" colSpan="6"></td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_u10 || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center">{fabric.ink_consumption_fof_white_top_coat || '-'}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold">{(() => {
                          const sum = [
                            parseFloat(fabric.ink_consumption_u10 || 0),
                            parseFloat(fabric.ink_consumption_fof_white_top_coat || 0)
                          ].reduce((a, b) => a + b, 0);
                          return sum > 0 ? sum.toFixed(2) : '-';
                        })()}</td>
                        <td className="border border-slate-400 px-2 py-1" colSpan="6"></td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1" colSpan="9"></td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-2 py-1 font-bold bg-slate-100" colSpan="8">Grand Total (ml)</td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold bg-slate-100">{fabric.ink_consumption_total || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {fabric.images && fabric.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {fabric.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="space-y-1">
                        <img src={img} alt={`${fabric.name}`} className="h-48 object-contain border" />
                        {fabric.image_captions?.[imgIdx] && (
                          <p className="text-xs text-center max-w-48">{fabric.image_captions[imgIdx]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {report.general_images && report.general_images.length > 0 && (
          <div className="mb-8 page-break">
            <h2 className="text-xl font-bold mb-4">General Report Images</h2>
            <div className="grid grid-cols-2 gap-4">
              {report.general_images.map((image, index) => (
                <div key={index} className="border p-3">
                  <img src={image.image_url} alt={image.caption || 'General report image'} className="w-full h-64 object-contain" />
                  {image.caption && <p className="text-sm text-center mt-2 whitespace-pre-wrap">{image.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Tables */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Test Summary</h2>
          <div className="flex gap-4 flex-wrap">
            {report.fabrics?.map((fabric, fabricIdx) => {
              const fabricTests = exportTests.filter(t => t.fabric_index === fabricIdx);
              if (fabricTests.length === 0) return null;
              
              return (
                <table key={fabricIdx} className="border-collapse border border-slate-400">
                  <thead>
                    <tr>
                      <th className="border border-slate-400 px-4 py-2 bg-slate-100 text-sm" colSpan="2">
                        Fabric Number {fabric.name || String(fabricIdx + 1).padStart(3, '0')}
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
          const fabricTests = exportTests.filter(t => t.fabric_index === fabricIdx).sort((a, b) => {
            const aId = a.id || '';
            const bId = b.id || '';
            return aId.localeCompare(bId);
          });
          
          return fabricTests.map((test, testIdx) => {
            const columns = test.grid_columns && test.grid_columns.length > 0 
              ? test.grid_columns 
              : getDefaultColumns(test.test_type);
            const rowLabels = test.row_labels && test.row_labels.length > 0
              ? test.row_labels
              : ['Area A', 'Area B', 'Area C'];

            return (
              <div key={`${fabricIdx}-${testIdx}`} className="mb-12 page-break">
                <h2 className="text-lg font-bold mb-2">Fabric Number {fabric.name || String(fabricIdx + 1).padStart(3, '0')}</h2>
                <h3 className="text-md font-semibold mb-4" style={{backgroundColor: '#ffff00', display: 'inline-block', padding: '2px 8px'}}>
                  Test {test.test_number || `${fabricIdx + 1}.${testIdx + 1}`}: {test.custom_title || getTestLabel(test.test_type)}
                </h3>
                {!test.is_internal && fabric.working_point && (
                  <p className="text-sm mb-3"><strong>Working Point:</strong> {fabric.working_point}</p>
                )}
                {test.design_name && (
                  <p className="text-sm mb-3"><strong>Design Name:</strong> {test.design_name}</p>
                )}

              {/* Test Grid */}
              {test.images_grid && test.images_grid.length > 0 ? (
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
                    {test.images_grid.map((row, rowIdx) => (
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
              ) : test.custom_images && test.custom_images.length > 0 ? (
                <div className="flex flex-wrap gap-3 mb-4">
                  {test.custom_images.map((img, imgIdx) => (
                    <img key={imgIdx} src={img} alt="" className="h-48 object-contain border" />
                  ))}
                </div>
              ) : (
                <div className="mb-4 p-4 border border-slate-300 bg-slate-50 text-sm text-slate-600">
                  No test images uploaded yet
                </div>
              )}

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
                    {test.test_parameters?.washing_cycles && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.washing_cycles}</td></tr>
                    )}
                    {test.test_parameters?.temperature && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.temperature}</td></tr>
                    )}
                    {test.test_parameters?.detergent && (
                      <tr><td className="border border-slate-400 px-3 py-1">{test.test_parameters.detergent}</td></tr>
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
                <div className="mt-3 border border-slate-300 p-3">
                  <h4 className="font-semibold text-sm mb-1">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{test.notes}</p>
                </div>
              )}
              </div>
            );
          });
        })}

        {/* Conclusion */}
        {(report.conclusion || (report.application_note_images && report.application_note_images.length > 0)) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Application Notes</h2>
            {report.conclusion && <div className="whitespace-pre-wrap text-sm">{report.conclusion}</div>}
            {report.application_note_images && report.application_note_images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {report.application_note_images.map((image, index) => (
                  <div key={index} className="border p-3">
                    <img src={image.image_url} alt={image.caption || 'Application note image'} className="w-full h-64 object-contain" />
                    {image.caption && <p className="text-sm text-center mt-2 whitespace-pre-wrap">{image.caption}</p>}
                  </div>
                ))}
              </div>
            )}
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
    bally_flex_minus20: 'Bally Flex -20',
    laundry_test: 'Laundry Test',
    custom: 'Custom Test'
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
    case 'laundry_test':
      return ['REF', 'Wash 1', 'Wash 3', 'Wash 5'];
    default:
      return ['REF'];
  }
}