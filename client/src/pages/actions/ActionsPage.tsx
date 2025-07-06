import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ActionItem from '../../components/common/ActionItem';
import ActionDetail from '../../components/common/ActionDetail';
import apiService from '../../utils/api';

interface Action {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'urgent' | 'completed';
  date: string;
  dueDate?: string;
  assignedBy?: string;
  relatedDocument?: string;
}

const ActionsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call to fetch actions
        // For now, we'll use dummy data
        const dummyActions: Action[] = [
          { 
            id: 1, 
            title: 'Document Approval Request', 
            description: 'Your document "Safety Compliance Report Q3" requires additional information before it can be approved. Please review the comments and resubmit.',
            status: 'pending', 
            date: '2023-10-15',
            dueDate: '2023-10-22',
            assignedBy: 'John Smith (Consultant)',
            relatedDocument: 'Safety Compliance Report Q3'
          },
          { 
            id: 2, 
            title: 'Profile Update Required', 
            description: 'Please update your company profile with the latest contact information and certification details.',
            status: 'urgent', 
            date: '2023-10-14',
            dueDate: '2023-10-18',
            assignedBy: 'System Administrator'
          },
          { 
            id: 3, 
            title: 'Document Resubmission', 
            description: 'Your "Environmental Impact Assessment" document was rejected. Please address the issues and resubmit.',
            status: 'pending', 
            date: '2023-10-12',
            dueDate: '2023-10-25',
            assignedBy: 'Maria Johnson (Consultant)',
            relatedDocument: 'Environmental Impact Assessment'
          },
          { 
            id: 4, 
            title: 'Compliance Update', 
            description: 'Your ISO certification has been verified and approved.',
            status: 'completed', 
            date: '2023-10-10',
            assignedBy: 'Certification Team',
            relatedDocument: 'ISO 9001 Certificate'
          },
        ];
        
        setActions(dummyActions);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch actions');
        setLoading(false);
      }
    };

    fetchActions();
  }, []);

  const handleActionClick = (actionId: number) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      setSelectedAction(action);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAction(null);
  };

  const handleCompleteAction = (actionId: number) => {
    // In a real application, this would make an API call to update the action status
    setActions(prevActions => 
      prevActions.map(action => 
        action.id === actionId 
          ? { ...action, status: 'completed' as 'completed' } 
          : action
      )
    );
    setSelectedAction(prev => prev ? { ...prev, status: 'completed' as 'completed' } : null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Actions</h1>
      
      {selectedAction ? (
        <ActionDetail 
          {...selectedAction}
          onComplete={handleCompleteAction}
          onClose={handleCloseDetail}
        />
      ) : (
        <div>
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium">Pending Actions</h2>
              <p className="text-sm text-gray-500">Review and complete these actions</p>
            </div>
            
            <div className="p-4">
              {actions.filter(a => a.status !== 'completed').length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No pending actions available at this time.
                </div>
              ) : (
                <div className="space-y-4">
                  {actions
                    .filter(action => action.status !== 'completed')
                    .map((action) => (
                      <ActionItem 
                        key={action.id}
                        {...action}
                        onClick={handleActionClick}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium">Completed Actions</h2>
              <p className="text-sm text-gray-500">Previously completed actions</p>
            </div>
            
            <div className="p-4">
              {actions.filter(a => a.status === 'completed').length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No completed actions available.
                </div>
              ) : (
                <div className="space-y-4">
                  {actions
                    .filter(action => action.status === 'completed')
                    .map((action) => (
                      <ActionItem 
                        key={action.id}
                        {...action}
                        onClick={handleActionClick}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPage;