import React, { useState } from 'react';
import { Upload, Plus, Check, X } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageViewerModal from './ImageViewerModal';

export default function TestImageGrid({ testType, imagesGrid, onChange, columns, onColumnsChange, rowLabels, onRowLabelsChange }) {
  const [uploading, setUploading] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editingCol, setEditingCol] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);

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
      default:
        return ['REF'];
    }
  };

  const activeColumns = (columns && columns.length > 0) ? columns : getDefaultColumns();
  
  // Initialize grid when test type is set
  React.useEffect(() => {
    if (!testType) return;
    
    // Only initialize if grid is truly empty
    if (!imagesGrid || imagesGrid.length === 0) {
      const defaultGrid = Array(3).fill(null).map(() => 
        Array(activeColumns.length).fill(null).map(() => ({ image_url: '', is_selected: false }))
      );
      const defaultLabels = ['Area A', 'Area B', 'Area C'];
      
      onChange(defaultGrid);
      onRowLabelsChange(defaultLabels);
    }
  }, [testType]);

  // Always show grid when testType exists
  const grid = (imagesGrid && imagesGrid.length > 0) 
    ? imagesGrid 
    : (testType ? Array(3).fill(null).map(() => 
        Array(activeColumns.length).fill(null).map(() => ({ image_url: '', is_selected: false }))
      ) : []);
  
  const labels = (rowLabels && rowLabels.length > 0) 
    ? rowLabels 
    : (testType ? ['Area A', 'Area B', 'Area C'] : []);

  const updateRowLabel = (rowIndex, newLabel) => {
    const newLabels = [...labels];
    newLabels[rowIndex] = newLabel;
    onRowLabelsChange(newLabels);
    setEditingRow(null);
  };

  const handleImageUpload = async (rowIndex, colIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(`${rowIndex}-${colIndex}`);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newGrid = grid.map((row, rIdx) => 
        row.map((cell, cIdx) => 
          rIdx === rowIndex && cIdx === colIndex 
            ? { ...cell, image_url: file_url }
            : cell
        )
      );
      onChange(newGrid);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading('');
    }
  };

  const toggleSelected = (rowIndex, colIndex) => {
    const newGrid = grid.map((row, rIdx) => 
      row.map((cell, cIdx) => ({
        ...cell,
        is_selected: rIdx === rowIndex && cIdx === colIndex ? !cell.is_selected : false
      }))
    );
    onChange(newGrid);
  };

  const addColumn = () => {
    const columnName = newColumnName.trim() || `${activeColumns.length * 10}`;
    const newColumns = [...activeColumns, columnName];
    const newGrid = grid.map(row => [...row, { image_url: '', is_selected: false }]);
    
    onColumnsChange(newColumns);
    onChange(newGrid);
    setNewColumnName('');
  };

  const addRow = () => {
    const newRow = Array(activeColumns.length).fill(null).map(() => ({ image_url: '', is_selected: false }));
    const newGrid = [...grid, newRow];
    const newLabels = [...labels, `Area ${String.fromCharCode(65 + labels.length)}`];
    
    onChange(newGrid);
    onRowLabelsChange(newLabels);
  };

  const removeColumn = (colIndex) => {
    if (activeColumns.length <= 1) {
      alert('Cannot remove the last column');
      return;
    }
    
    if (!confirm(`Remove column "${activeColumns[colIndex]}"?`)) {
      return;
    }
    
    const newColumns = activeColumns.filter((_, i) => i !== colIndex);
    const newGrid = grid.map(row => row.filter((_, i) => i !== colIndex));
    
    // Update grid first, then columns to ensure consistency
    onChange(newGrid);
    onColumnsChange(newColumns);
  };

  const removeRow = (rowIndex) => {
    if (grid.length <= 1) {
      alert('Cannot remove the last row');
      return;
    }
    
    const newGrid = grid.filter((_, i) => i !== rowIndex);
    const newLabels = labels.filter((_, i) => i !== rowIndex);
    
    onChange(newGrid);
    onRowLabelsChange(newLabels);
  };

  const updateColumnName = (colIndex, newName) => {
    const newColumns = [...activeColumns];
    newColumns[colIndex] = newName;
    onColumnsChange(newColumns);
    setEditingCol(null);
  };

  return (
    <div className="space-y-3">
      {/* Add Column Section */}
      <div className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
        <Input
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="Column name (optional, e.g., 60, 70...)"
          className="bg-white h-9"
          onKeyPress={(e) => {
            if (e.key === 'Enter') addColumn();
          }}
        />
        <Button onClick={addColumn} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 p-2 text-sm font-semibold text-slate-700 bg-slate-200">
              Sample Area
            </th>
            {activeColumns.map((col, idx) => (
              <th key={idx} className="border border-slate-300 p-2 text-sm font-semibold text-slate-700 relative group">
                {editingCol === idx ? (
                  <Input
                    value={col}
                    onChange={(e) => updateColumnName(idx, e.target.value)}
                    onBlur={() => setEditingCol(null)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') setEditingCol(null);
                    }}
                    className="h-7 text-sm text-center"
                    autoFocus
                  />
                ) : (
                  <div 
                    onClick={() => setEditingCol(idx)}
                    className="cursor-pointer hover:bg-slate-200 px-2 py-1 rounded"
                    title="Click to edit"
                  >
                    {col}
                  </div>
                )}
                {idx > 0 && editingCol !== idx && (
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
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border border-slate-300 p-2 bg-slate-50 font-medium text-slate-700 text-sm relative group">
                {editingRow === rowIndex ? (
                  <Input
                    value={labels[rowIndex]}
                    onChange={(e) => updateRowLabel(rowIndex, e.target.value)}
                    onBlur={() => setEditingRow(null)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') setEditingRow(null);
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <div 
                    onClick={() => setEditingRow(rowIndex)}
                    className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
                    title="Click to edit"
                  >
                    {labels[rowIndex]}
                  </div>
                )}
                {grid.length > 1 && editingRow !== rowIndex && (
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
              {activeColumns.map((_, colIndex) => {
                const cell = row[colIndex] || { image_url: '', is_selected: false };
                return (
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
                      <div className="absolute top-1 left-1 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelected(rowIndex, colIndex);
                          }}
                          className={`${cell.is_selected ? 'bg-red-500' : 'bg-slate-800/70'} text-white rounded px-2 py-1 text-xs hover:opacity-90 transition-opacity`}
                          title={cell.is_selected ? 'Unmark as fail point' : 'Mark as fail point'}
                        >
                          {cell.is_selected ? '✓ Fail Point' : 'Mark Fail'}
                        </button>
                      </div>
                      <label className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
                  ) : (
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
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400" />
                      )}
                    </label>
                  )}
                </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Row Button */}
      <Button onClick={addRow} size="sm" variant="outline" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Sample Area
      </Button>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-slate-700">
          <strong>Tip:</strong> Click on an image to view it larger with zoom. Use "Select as fail point" to mark the critical failure point with a red border.
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