import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Eye, Trash2, FileDown, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('-date_completed'); // newest first

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', sortOrder],
    queryFn: () => base44.entities.Report.list(sortOrder),
  });

  const deleteReport = async (id) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await base44.entities.Report.delete(id);
      window.location.reload();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.customer_name?.toLowerCase().includes(query) ||
      report.application_engineer?.toLowerCase().includes(query) ||
      report.requestor?.toLowerCase().includes(query) ||
      report.machine_model?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Sample Reports</h1>
              <p className="text-slate-600">Textile printing durability test reports</p>
            </div>
            <Link to={createPageUrl('CreateReport')}>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg">
                <Plus className="w-5 h-5" />
                New Report
              </Button>
            </Link>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer, engineer, requestor, machine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-date_completed">Newest First</SelectItem>
                <SelectItem value="date_completed">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            </div>
            </div>

        {/* Reports Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No reports yet</h3>
              <p className="text-slate-500 mb-6">Create your first sample report to get started</p>
              <Link to={createPageUrl('CreateReport')}>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Plus className="w-5 h-5" />
                  Create Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No reports found</h3>
              <p className="text-slate-500">Try adjusting your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <Badge className={`${getStatusColor(report.status)} border`}>
                      {report.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {report.customer_name || 'Untitled Customer'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {format(new Date(report.date_completed), 'MMM dd, yyyy')}
                  </p>
                  
                  <div className="space-y-1 text-sm text-slate-600 mb-4">
                    {report.application_engineer && (
                      <p><span className="font-medium">Engineer:</span> {report.application_engineer}</p>
                    )}
                    {report.requestor && (
                      <p><span className="font-medium">Requestor:</span> {report.requestor}</p>
                    )}
                    {report.fabrics && report.fabrics.length > 0 && (
                      <p><span className="font-medium">Fabrics:</span> {report.fabrics.length}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={createPageUrl('CreateReport') + `?id=${report.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={createPageUrl('ViewReportPDF') + `?id=${report.id}`} target="_blank">
                      <Button variant="outline" size="icon">
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReport(report.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}