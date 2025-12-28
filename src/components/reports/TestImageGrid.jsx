import React, { useState } from 'react';
import { Upload, Plus, Check } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function TestImageGrid({ testType, imagesGrid, onChange }) {
  const [uploading, setUploading] = useState('');

  const getGridConfig = () => {
    switch (testType) {
      case 'sand_grinding':
        return { columns: ['REF', '10', '20', '30', '40', '50'], rows: 3 };
      case 'dry_grinding':
        return { columns: ['REF', '5K', '10K', '15K', '20K', '25K', '30K'], rows: 3 };
      case 'wet_grinding':
        return { columns: ['REF', '4K', '8K', '12K'], rows: 3 };
      case 'bally_flex_rt':
        return { columns: ['REF', '50K', '100K', '150K'], rows: 3 };
      case 'bally_flex_minus20':
        return { columns: ['REF', '40K'], rows: 3 };
      default:
        return { columns: ['REF'], rows: 3 };
    }
  };

  const config = getGridConfig();

  // Initialize grid if empty
  const grid = imagesGrid && imagesGrid.length > 0 
    ? imagesGrid 
    : Array(config.rows).fill(null).map(() => 
        Array(config.columns.length).fill(null).map(() => ({ image_url: '', is_selected: false }))
      );

  const handleImageUpload = async (rowIndex, colIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(`${rowIndex}-${colIndex}`);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newGrid = JSON.parse(JSON.stringify(grid));
      newGrid[rowIndex][colIndex].image_url = file_url;
      onChange(newGrid);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading('');
    }
  };

  const toggleSelected = (rowIndex, colIndex) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    // First, unselect all
    newGrid.forEach(row => row.forEach(cell => cell.is_selected = false));
    // Then select this one
    newGrid[rowIndex][colIndex].is_selected = !grid[rowIndex][colIndex].is_selected;
    onChange(newGrid);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            {config.columns.map((col, idx) => (
              <th key={idx} className="border border-slate-300 p-2 text-sm font-semibold text-slate-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`border ${cell.is_selected ? 'border-red-500 border-4' : 'border-slate-300'} p-1 relative`}
                  style={{ width: `${100 / config.columns.length}%`, height: '140px' }}
                >
                  {cell.image_url ? (
                    <div className="relative w-full h-full group">
                      <img 
                        src={cell.image_url} 
                        alt={`Test ${rowIndex}-${colIndex}`}
                        className="w-full h-full object-cover rounded cursor-pointer"
                        onClick={() => toggleSelected(rowIndex, colIndex)}
                      />
                      {cell.is_selected && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
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
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        Click on an image to highlight it with a red border (indicates critical point for pass/fail)
      </p>
    </div>
  );
}