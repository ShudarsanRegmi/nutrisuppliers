import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { imageService } from '@/lib/appwrite';

export function AppwriteTest() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');

  const testAppwriteConnection = async () => {
    setTestStatus('testing');
    setTestResult('Testing Appwrite Functions connection...');

    try {
      console.log('🔄 Testing Appwrite Functions with Firebase auth...');

      // Create a small test file to upload
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      // Try to upload using our function-based service
      console.log('📤 Testing image upload function...');
      const uploadResult = await imageService.uploadImage(testFile);

      console.log('✅ Upload test successful:', uploadResult);

      // Try to delete the test file
      console.log('🗑️ Testing image delete function...');
      await imageService.deleteImage(uploadResult.id);

      console.log('✅ Delete test successful');

      setTestResult(`✅ Success! Appwrite Functions are working correctly with Firebase auth.`);
      setTestStatus('success');

    } catch (error) {
      console.error('❌ Appwrite Functions test failed:', error);

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setTestResult(`❌ Failed: ${errorMessage}`);
      setTestStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'testing':
        return <AlertCircle className="text-yellow-500 animate-pulse" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusBadge = () => {
    switch (testStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Appwrite Functions Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Configuration:</p>
          <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
            <div>Endpoint: https://fra.cloud.appwrite.io/v1</div>
            <div>Project ID: 68a03ad10030ac53cb92</div>
            <div>Bucket ID: 68a03b2600160922b23d</div>
          </div>
        </div>

        {testResult && (
          <div className="text-sm p-3 rounded bg-gray-50 border">
            {testResult}
          </div>
        )}

        <Button
          onClick={testAppwriteConnection}
          disabled={testStatus === 'testing'}
          className="w-full"
        >
          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>This test will:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Test Firebase token verification</li>
            <li>Test Appwrite Functions upload</li>
            <li>Test Appwrite Functions delete</li>
            <li>Verify end-to-end functionality</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
