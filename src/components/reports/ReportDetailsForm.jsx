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
            <Label htmlFor="customer_name" className="text-slate-700">Customer Name</Label>
            <Input
              id="customer_name"
              value={details.customer_name || ''}
              onChange={(e) => handleChange('customer_name', e.target.value)}
              placeholder="Enter customer name"
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


        </div>
      </CardContent>
    </Card>
  );
}