import React, { useState, useEffect } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageViewerModal from './ImageViewerModal';
import { toast } from '@/components/ui/use-toast';

export default function TestImageGrid({ testType, imagesGrid, onChange, columns, onColumnsChange, rowLabels, onRowLabelsChange, readOnly = false }) {
  const [uploading, setUploading] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editingCol, setEditingCol] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [localGrid, setLocalGrid] = useState(imagesGrid || []);
  const [localLabels, setLocalLabels] = useState(rowLabels || []);

  // Sync local state with props
  useEffect(() => {
    setLocalGrid(imagesGrid || []);
  }, [imagesGrid]);

  useEffect(() => {
    setLocalLabels(rowLabels || []);
  }, [rowLabels]);

  const getDefaultColumns = () => {
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
  };

  const activeColumns = columns?.length > 0 ? columns : getDefaultColumns();

  // Use local state for display
  const currentGrid = localGrid;
  const currentLabels = localLabels;

  const handleImageUpload = async (rowIndex, colIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(`${rowIndex}-${colIndex}`);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newGrid = currentGrid.map((row, rIdx) => 
        row.map((cell, cIdx) => 
          rIdx === rowIndex && cIdx === colIndex 
            ? { ...cell, image_url: file_url }
            : cell
        )
      );
      setLocalGrid(newGrid);
      onChange(newGrid);
      setUploadSuccess(`${rowIndex}-${colIndex}`);
      setTimeout(() => setUploadSuccess(''), 2500);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading('');
    }
  };

  const toggleSelected = (rowIndex, colIndex) => {
    const newGrid = currentGrid.map((row, rIdx) => 
      row.map((cell, cIdx) => 
        rIdx === rowIndex && cIdx === colIndex 
          ? { ...cell, is_selected: !cell.is_selected }
          : cell
      )
    );
    setLocalGrid(newGrid);
    onChange(newGrid);
  };

  const addColumn = () => {
    const columnName = `Col ${activeColumns.length + 1}`;
    const newColumns = [...activeColumns, columnName];
    const newGrid = localGrid.map(row => [...row, { image_url: '', is_selected: false }]);
    
    // Update local state immediately
    setLocalGrid(newGrid);
    
    // Update parent
    onChange(newGrid);
    onColumnsChange(newColumns);
  };

  const addRow = () => {
    if (!testType) {
      alert('Please select a test type first');
      return;
    }

    // Create new row with cells for each column
    const newRow = [];
    for (let i = 0; i < activeColumns.length; i++) {
      newRow.push({ image_url: '', is_selected: false });
    }
    
    // Add to grid
    const newGrid = [...localGrid, newRow];
    
    // Create label for new row
    const newLabel = `Area ${String.fromCharCode(65 + localLabels.length)}`;
    const newLabels = [...localLabels, newLabel];
    
    // Update local state immediately
    setLocalGrid(newGrid);
    setLocalLabels(newLabels);
    
    // Update parent
    console.log('TestImageGrid: Adding row. New grid length:', newGrid.length, 'New labels:', newLabels);
    onChange(newGrid);
    onRowLabelsChange(newLabels);
  };

  const removeColumn = (colIndex) => {
    if (!confirm(`Remove column "${activeColumns[colIndex]}"?`)) return;
    
    const newColumns = activeColumns.filter((_, i) => i !== colIndex);
    const newGrid = localGrid.map(row => row.filter((_, i) => i !== colIndex));
    
    // Update local state immediately
    setLocalGrid(newGrid);
    
    // Update parent
    onChange(newGrid);
    onColumnsChange(newColumns);
  };

  const removeRow = (rowIndex) => {
    if (!confirm(`Remove row "${localLabels[rowIndex] || `Row ${rowIndex + 1}`}"?`)) return;
    
    const newGrid = localGrid.filter((_, i) => i !== rowIndex);
    const newLabels = localLabels.filter((_, i) => i !== rowIndex);
    
    // Update local state immediately
    setLocalGrid(newGrid);
    setLocalLabels(newLabels);
    
    // Update parent with both values at once
    onChange(newGrid, newLabels);
  };

  const updateColumnName = (colIndex, newName) => {
    const newColumns = [...activeColumns];
    newColumns[colIndex] = newName;
    onColumnsChange(newColumns);
    setEditingCol(null);
  };

  const updateRowLabel = (rowIndex, newLabel) => {
    const newLabels = [...currentLabels];
    newLabels[rowIndex] = newLabel;
    onRowLabelsChange(newLabels);
    setEditingRow(null);
  };

  return (
    <div className="space-y-3">
      {/* Add Buttons at Top */}
      {!readOnly && (
        <div className="flex gap-2">
          <Button onClick={addRow} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Sample Area
          </Button>
          <Button onClick={addColumn} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Column
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-sm font-semibold text-slate-700 bg-slate-200">
                Sample Area
              </th>
              {activeColumns.map((col, idx) => (
                <th key={idx} className="border border-slate-300 p-2 text-sm font-semibold text-slate-700 relative group">
                  {editingCol === idx && !readOnly ? (
                    <Input
                      value={col}
                      onChange={(e) => updateColumnName(idx, e.target.value)}
                      onBlur={() => setEditingCol(null)}
                      onKeyPress={(e) => e.key === 'Enter' && setEditingCol(null)}
                      className="h-7 text-sm text-center"
                      autoFocus
                    />
                  ) : (
                    <div 
                      onClick={() => !readOnly && setEditingCol(idx)}
                      className={readOnly ? "" : "cursor-pointer hover:bg-slate-200 px-2 py-1 rounded"}
                      title={readOnly ? "" : "Click to edit"}
                    >
                      {col}
                    </div>
                  )}
                  {editingCol !== idx && !readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeColumn(idx);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Remove column"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentGrid.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + 1} className="border border-slate-300 p-8 text-center text-slate-500">
                  No rows yet. Click "Add Sample Area" to add rows.
                </td>
              </tr>
            ) : (
              currentGrid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border border-slate-300 p-2 bg-slate-50 font-medium text-slate-700 text-sm relative group">
                  {editingRow === rowIndex && !readOnly ? (
                    <Input
                      value={currentLabels[rowIndex] || ''}
                      onChange={(e) => updateRowLabel(rowIndex, e.target.value)}
                      onBlur={() => setEditingRow(null)}
                      onKeyPress={(e) => e.key === 'Enter' && setEditingRow(null)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div 
                      onClick={() => !readOnly && setEditingRow(rowIndex)}
                      className={readOnly ? "" : "cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"}
                      title={readOnly ? "" : "Click to edit"}
                    >
                      {currentLabels[rowIndex] || `Row ${rowIndex + 1}`}
                    </div>
                  )}
                  {editingRow !== rowIndex && !readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(rowIndex);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Remove row"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </td>
                {row.map((cell, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`border ${cell.is_selected ? 'border-red-500 border-4' : 'border-slate-300'} p-1 relative`}
                    style={{ width: `${100 / activeColumns.length}%`, height: '140px' }}
                  >
                    {cell.image_url ? (
                      <div className="relative w-full h-full group">
                        <img 
                          src={cell.image_url} 
                          alt={`Test ${rowIndex}-${colIndex}`}
                          className="w-full h-full object-cover rounded cursor-pointer"
                          onClick={() => setViewerImage(cell.image_url)}
                        />
                        {uploadSuccess === `${rowIndex}-${colIndex}` && (
                          <span className="absolute top-1 right-1 bg-green-600 text-white rounded px-2 py-1 text-xs font-semibold">
                            Uploaded
                          </span>
                        )}
                        {!readOnly && (
                          <>
                            <div className="absolute top-1 left-1 flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelected(rowIndex, colIndex);
                                }}
                                className={`${cell.is_selected ? 'bg-red-500' : 'bg-slate-800/70'} text-white rounded px-2 py-1 text-xs transition-opacity ${cell.is_selected ? '' : 'opacity-0 group-hover:opacity-100'}`}
                                title={cell.is_selected ? 'Unmark as fail point' : 'Mark as fail point'}
                              >
                                {cell.is_selected ? '✓ Fail Point' : 'Mark Fail'}
                              </button>
                            </div>
                            <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const removedCell = currentGrid[rowIndex][colIndex];
                                  const newGrid = currentGrid.map((row, rIdx) => 
                                    row.map((c, cIdx) => 
                                      rIdx === rowIndex && cIdx === colIndex 
                                        ? { ...c, image_url: '', is_selected: false }
                                        : c
                                    )
                                  );
                                  setLocalGrid(newGrid);
                                  onChange(newGrid);
                                  toast({
                                    title: 'Image removed',
                                    description: 'Use Undo to restore it.',
                                    action: (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const restoredGrid = newGrid.map((row, rIdx) =>
                                            row.map((c, cIdx) =>
                                              rIdx === rowIndex && cIdx === colIndex ? removedCell : c
                                            )
                                          );
                                          setLocalGrid(restoredGrid);
                                          onChange(restoredGrid);
                                        }}
                                      >
                                        Undo
                                      </Button>
                                    )
                                  });
                                }}
                                className="bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <label className="bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(rowIndex, colIndex, e)}
                                  className="hidden"
                                  disabled={uploading === `${rowIndex}-${colIndex}`}
                                />
                                <Plus className="w-3 h-3" />
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    ) : !readOnly ? (
                      <label className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(rowIndex, colIndex, e)}
                          className="hidden"
                          disabled={uploading === `${rowIndex}-${colIndex}`}
                        />
                        {uploading === `${rowIndex}-${colIndex}` ? (
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : uploadSuccess === `${rowIndex}-${colIndex}` ? (
                          <span className="text-xs text-green-600 font-semibold">Uploaded</span>
                        ) : (
                          <Upload className="w-6 h-6 text-slate-400" />
                        )}
                      </label>
                    ) : null}
                  </td>
                ))}
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-slate-700">
          <strong>Tip:</strong> Uploaded images are added to the report immediately; click Save Draft to store them permanently. Use "Select as fail point" to mark the critical failure point with a red border.
        </p>
      </div>

      <ImageViewerModal 
        imageUrl={viewerImage} 
        isOpen={!!viewerImage} 
        onClose={() => setViewerImage(null)} 
      />
    </div>
  );
}