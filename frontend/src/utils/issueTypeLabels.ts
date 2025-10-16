import { IssueType } from '../types';

/**
 * Maps issue type enum values to their display labels
 */
export const getIssueTypeLabel = (issueType: IssueType | null | undefined): string => {
  if (!issueType) return 'N/A';
  
  const labels: Record<IssueType, string> = {
    'product_not_as_listed': 'Product Not Live After Return',
    'giant_discrepancy_brandless_inverterless': 'GRN Discrepancy',
    'physical_vs_scale_mismatch': 'Physical Product vs SKU Mismatch',
    'other': 'Other',
  };
  
  return labels[issueType] || issueType.replace(/_/g, ' ');
};

/**
 * All issue types with their labels for forms and dropdowns
 */
export const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'product_not_as_listed', label: 'Product Not Live After Return' },
  { value: 'giant_discrepancy_brandless_inverterless', label: 'GRN Discrepancy' },
  { value: 'physical_vs_scale_mismatch', label: 'Physical Product vs SKU Mismatch' },
  { value: 'other', label: 'Other' },
];

