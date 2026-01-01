import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function ReportDetailsForm({ details, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Calendar className="w-5 h-5 text-slate-600" />
          Report Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="project_name" className="text-slate-700">Project Name</Label>
            <Input
              id="project_name"
              value={details.project_name || ''}
              onChange={(e) => handleChange('project_name', e.target.value)}
              placeholder="Enter project name"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_completed" className="text-slate-700">Date Completed *</Label>
            <Input
              id="date_completed"
              type="date"
              value={details.date_completed || ''}
              onChange={(e) => handleChange('date_completed', e.target.value)}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="application_engineer" className="text-slate-700">Application Engineer *</Label>
            <Input
              id="application_engineer"
              value={details.application_engineer || ''}
              onChange={(e) => handleChange('application_engineer', e.target.value)}
              placeholder="Engineer name"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Report Type</Label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="report_type"
                  value="demo"
                  checked={details.report_type === 'demo'}
                  onChange={(e) => handleChange('report_type', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-slate-700">Demo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="report_type"
                  value="sample"
                  checked={details.report_type === 'sample'}
                  onChange={(e) => handleChange('report_type', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-slate-700">Sample</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestor" className="text-slate-700">Requestor</Label>
            <Input
              id="requestor"
              value={details.requestor || ''}
              onChange={(e) => handleChange('requestor', e.target.value)}
              placeholder="Requestor name"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine_model" className="text-slate-700">Machine Model</Label>
            <Input
              id="machine_model"
              value={details.machine_model || ''}
              onChange={(e) => handleChange('machine_model', e.target.value)}
              placeholder="e.g., Atlas Max"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ink_version" className="text-slate-700">Ink Version</Label>
            <Input
              id="ink_version"
              value={details.ink_version || ''}
              onChange={(e) => handleChange('ink_version', e.target.value)}
              placeholder="e.g., Robusto U10"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup" className="text-slate-700">Set Up</Label>
            <Input
              id="setup"
              value={details.setup || ''}
              onChange={(e) => handleChange('setup', e.target.value)}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-slate-700">Resolution</Label>
            <Input
              id="resolution"
              value={details.resolution || ''}
              onChange={(e) => handleChange('resolution', e.target.value)}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curing_time_min" className="text-slate-700">Curing Time (minutes)</Label>
            <Input
              id="curing_time_min"
              type="number"
              value={details.curing_time_min || ''}
              onChange={(e) => handleChange('curing_time_min', parseFloat(e.target.value))}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curing_temp_celsius" className="text-slate-700">Curing Temp (Celsius)</Label>
            <Input
              id="curing_temp_celsius"
              type="number"
              value={details.curing_temp_celsius || ''}
              onChange={(e) => handleChange('curing_temp_celsius', parseFloat(e.target.value))}
              className="border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="working_point" className="text-slate-700">Working Point</Label>
            <Input
              id="working_point"
              value={details.working_point || ''}
              onChange={(e) => handleChange('working_point', e.target.value)}
              placeholder="e.g., 85/80"
              className="border-slate-300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}