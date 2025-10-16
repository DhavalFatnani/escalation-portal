import { IssueType } from '../types';

/**
 * Since we now use labels directly as the type, this function just returns the value
 */
export const getIssueTypeLabel = (issueType: IssueType | null | undefined): string => {
  if (!issueType) return 'N/A';
  return issueType; // Now the type IS the label
};

/**
 * All issue types - now using labels directly as values
 */
export const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'Product Not Live After Return', label: 'Product Not Live After Return' },
  { value: 'GRN Discrepancy', label: 'GRN Discrepancy' },
  { value: 'Physical Product vs SKU Mismatch', label: 'Physical Product vs SKU Mismatch' },
  { value: 'Other', label: 'Other' },
];

