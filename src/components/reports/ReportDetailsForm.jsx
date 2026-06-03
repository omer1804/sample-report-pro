import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function ReportDetailsForm({ details, onChange, readOnly = false }) {
  const emptyFieldClass = (value) => !readOnly && !value ? 'border-red-300 bg-red-50/40' : 'border-slate-300';

  const handleChange = (field, value) => {
    if (readOnly) return;
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
          <div className="space-y-2">
            <Label htmlFor="customer_name" className="text-slate-700">Customer Name</Label>
            <Input
              id="customer_name"
              value={details.customer_name || ''}
              onChange={(e) => handleChange('customer_name', e.target.value)}
              placeholder="Enter customer name"
              className={emptyFieldClass(details.customer_name)}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task_number" className="text-slate-700">Task Number</Label>
            <Input
              id="task_number"
              value={details.task_number || ''}
              onChange={(e) => handleChange('task_number', e.target.value)}
              placeholder="Enter task number"
              className={emptyFieldClass(details.task_number)}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_completed" className="text-slate-700">Date Completed *</Label>
            <Input
              id="date_completed"
              type="date"
              value={details.date_completed || ''}
              onChange={(e) => handleChange('date_completed', e.target.value)}
              className={emptyFieldClass(details.date_completed)}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="application_engineer" className="text-slate-700">Application Engineer *</Label>
            <Input
              id="application_engineer"
              value={details.application_engineer || ''}
              onChange={(e) => handleChange('application_engineer', e.target.value)}
              placeholder="Engineer name"
              className={emptyFieldClass(details.application_engineer)}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestor" className="text-slate-700">Requestor</Label>
            <Input
              id="requestor"
              value={details.requestor || ''}
              onChange={(e) => handleChange('requestor', e.target.value)}
              placeholder="Requestor name"
              className={emptyFieldClass(details.requestor)}
              readOnly={readOnly}
            />
          </div>


        </div>
      </CardContent>
    </Card>
  );
}