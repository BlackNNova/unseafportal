import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🧪 TEST: Error boundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🧪 TEST: Error boundary details:', { error, errorInfo });
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
              <h2 className="text-xl font-bold text-red-800">
                🧪 TEST: Admin Dashboard Error
              </h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Something went wrong in the admin dashboard:</p>
              <div className="bg-red-100 p-3 rounded text-sm text-red-800 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin/login'} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>

            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer">
                🧪 Debug Details
              </summary>
              <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-32">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
