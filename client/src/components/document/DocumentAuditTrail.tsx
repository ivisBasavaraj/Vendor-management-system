import React, { useState, useEffect } from 'react';
import { ClockIcon, UserIcon, DocumentIcon } from '@heroicons/react/24/outline';
import apiService from '../../utils/api';
import Card from '../ui/Card';

interface AuditEvent {
  id: string;
  documentId: string;
  action: 'created' | 'updated' | 'reviewed' | 'approved' | 'rejected' | 'commented';
  user: {
    id: string;
    name: string;
    role: string;
  };
  details: string;
  timestamp: string;
  metadata?: {
    previousStatus?: string;
    newStatus?: string;
    comment?: string;
  };
}

interface DocumentAuditTrailProps {
  documentId: string;
  className?: string;
}

const DocumentAuditTrail: React.FC<DocumentAuditTrailProps> = ({ documentId, className = '' }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        const response = await apiService.documents.getAuditTrail(documentId);
        setEvents(response.data);
      } catch (err) {
        setError('Failed to load audit trail');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [documentId]);

  const getActionIcon = (action: AuditEvent['action']) => {
    switch (action) {
      case 'created':
      case 'updated':
        return <DocumentIcon className="h-5 w-5 text-blue-500" />;
      case 'reviewed':
      case 'approved':
      case 'rejected':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'commented':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: AuditEvent['action']) => {
    switch (action) {
      case 'created':
        return 'text-blue-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'reviewed':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Document History</h3>
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pl-8 pb-6 last:pb-0">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200"></div>
            
            {/* Event dot */}
            <div className="absolute left-0 top-1 rounded-full bg-white p-1 border-2 border-gray-200">
              {getActionIcon(event.action)}
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${getActionColor(event.action)}`}>
                  {event.user.name}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-gray-600">{event.details}</p>

              {event.metadata && (
                <div className="mt-2 text-sm">
                  {event.metadata.previousStatus && event.metadata.newStatus && (
                    <p className="text-gray-500">
                      Status changed from{' '}
                      <span className="font-medium">{event.metadata.previousStatus}</span>
                      {' '}to{' '}
                      <span className="font-medium">{event.metadata.newStatus}</span>
                    </p>
                  )}
                  {event.metadata.comment && (
                    <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                      "{event.metadata.comment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DocumentAuditTrail; 