import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import {
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

export interface DocumentCardProps {
  id: string;
  title: string;
  documentType: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'draft';
  createdAt: string;
  submissionDate?: string;
  vendorName?: string;
  fileCount?: number;
  thumbnailUrl?: string;
  onClick?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  documentType,
  status,
  createdAt,
  submissionDate,
  vendorName,
  fileCount = 1,
  thumbnailUrl,
  onClick,
}) => {
  // Status badge variant mapping
  const statusVariantMap = {
    pending: 'warning',
    under_review: 'primary',
    approved: 'success',
    rejected: 'danger',
    draft: 'neutral',
  } as const;

  // Status icon mapping
  const statusIconMap = {
    pending: <ClockIcon className="h-4 w-4" />,
    under_review: <EyeIcon className="h-4 w-4" />,
    approved: <CheckCircleIcon className="h-4 w-4" />,
    rejected: <XCircleIcon className="h-4 w-4" />,
    draft: <DocumentIcon className="h-4 w-4" />,
  };

  // Document type icon mapping
  const documentTypeIconMap: Record<string, React.ReactNode> = {
    contract: <DocumentTextIcon className="h-6 w-6 text-blue-500" />,
    invoice: <DocumentChartBarIcon className="h-6 w-6 text-green-500" />,
    report: <DocumentDuplicateIcon className="h-6 w-6 text-purple-500" />,
    proposal: <DocumentIcon className="h-6 w-6 text-amber-500" />,
  };

  const documentIcon = documentTypeIconMap[documentType.toLowerCase()] || <DocumentIcon className="h-6 w-6 text-neutral-500" />;
  
  // Format dates
  const formattedCreatedAt = format(new Date(createdAt), 'MMM d, yyyy');
  const formattedSubmissionDate = submissionDate 
    ? format(new Date(submissionDate), 'MMM d, yyyy') 
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full cursor-pointer"
        onClick={onClick}
        hover
      >
        <div className="flex flex-col h-full">
          {/* Card Header */}
          <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center">
              <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-lg mr-3">
                {documentIcon}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {documentType}
                </span>
                <h3 className="font-medium text-neutral-900 dark:text-white line-clamp-1 mt-0.5">
                  {title}
                </h3>
              </div>
            </div>
            
            <Badge 
              variant={statusVariantMap[status]} 
              rounded
              icon={statusIconMap[status]}
            >
              {status.replace('_', ' ')}
            </Badge>
          </div>
          
          {/* Card Body */}
          <div className="p-4 flex-1">
            <div className="space-y-2">
              {vendorName && (
                <div className="flex items-start">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 w-24">Vendor:</span>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{vendorName}</span>
                </div>
              )}
              
              <div className="flex items-start">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 w-24">Created:</span>
                <span className="text-xs text-neutral-700 dark:text-neutral-300">{formattedCreatedAt}</span>
              </div>
              
              {formattedSubmissionDate && (
                <div className="flex items-start">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 w-24">Submitted:</span>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300">{formattedSubmissionDate}</span>
                </div>
              )}
              
              <div className="flex items-start">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 w-24">Files:</span>
                <span className="text-xs text-neutral-700 dark:text-neutral-300">{fileCount} attachment{fileCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Card Footer */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 flex justify-end">
            <Link 
              to={`/documents/${id}`}
              className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
            >
              View details
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DocumentCard; 