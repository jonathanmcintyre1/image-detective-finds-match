
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ApiKeyReminderProps {
  showApiKeyReminder: boolean;
  apiKey: string;
}

const ApiKeyReminder: React.FC<ApiKeyReminderProps> = ({ showApiKeyReminder, apiKey }) => {
  if (!showApiKeyReminder || apiKey) return null;
  
  return (
    <div className="mb-4">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm md:text-base">
          You need to set a Google Cloud Vision API key to use this app. Click "Set API Key" above.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ApiKeyReminder;
