import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Folder, Images, ClipboardCheck, Download, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    title: '1. Create a report',
    icon: FileText,
    text: 'Click New Report, then fill Report Name, Customer Name, Date, Application Engineer, Requestor, and Task Number if needed.'
  },
  {
    title: '2. Add fabrics',
    icon: Folder,
    text: 'Add each fabric with material details, machine settings, ink consumption, curing details, and fabric images.'
  },
  {
    title: '3. Add tests and images',
    icon: Images,
    text: 'For every fabric, add the needed tests such as Sand Grinding, Dry/Wet Grinding, Bally Flex, Laundry Test, or Custom Test.'
  },
  {
    title: '4. Mark results',
    icon: ClipboardCheck,
    text: 'Choose Pass or Fail for each test, add notes, and decide if the test is internal or selected for export.'
  },
  {
    title: '5. Save or complete',
    icon: BookOpen,
    text: 'Use Save Draft while working. Use Complete Report when the report is final.'
  },
  {
    title: '6. Export or manage',
    icon: Download,
    text: 'Export PDF, selected PDF, Excel, ZIP images, backup the report, duplicate it, rename it, or delete it from the customer folder.'
  }
];

const options = [
  'Report Name controls the name shown inside the customer folder.',
  'Customer Name controls which folder the report appears in.',
  'Internal tests are kept out of customer export.',
  'Export Selected PDF includes only selected tests.',
  'ZIP download includes images and attachments.',
  'Backup can be restored later if needed.'
];

export default function Instructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        <Link to="/Reports">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Button>
        </Link>

        <div className="mb-8">
          <Badge className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100">Short user guide</Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">How to Create a Full Report</h1>
          <p className="text-slate-600 max-w-3xl">
            Follow these steps to build a complete textile test report, add images, manage test results, and export the final files.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm leading-6">{step.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-slate-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle>What options does the user have?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.map((option) => (
                <div key={option} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                  {option}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/60 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Recommended workflow</h2>
            <p className="text-sm text-slate-700 leading-6">
              New Report → Fill details → Add fabrics → Add tests and images → Mark results → Add notes and attachments → Save/Complete → Export PDF, Excel, or ZIP.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Badge variant="outline" className="gap-1 bg-white"><Copy className="w-3 h-3" /> Duplicate reports</Badge>
              <Badge variant="outline" className="gap-1 bg-white"><BookOpen className="w-3 h-3" /> Rename reports</Badge>
              <Badge variant="outline" className="gap-1 bg-white"><Trash2 className="w-3 h-3" /> Delete old reports</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}