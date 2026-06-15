import { base44 } from '@/api/base44Client';

export async function logActivity(action, report = {}, details = '') {
  await base44.entities.ActivityLog.create({
    action,
    report_id: report.id || report.report_id || '',
    report_name: report.report_name || report.task_number || '',
    customer_name: report.customer_name || '',
    details,
    performed_at: new Date().toISOString()
  });
}