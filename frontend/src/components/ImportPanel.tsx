import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api, ImportStatus } from '../services/api';

interface ImportPanelProps {
  status: ImportStatus | null;
  onImportComplete: () => void;
}

export function ImportPanel({ status, onImportComplete }: ImportPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImporting = status?.status === 'parsing' || status?.status === 'computing';

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Please upload an XML file (export.xml from Apple Health)');
      return;
    }

    setError(null);
    try {
      await api.uploadFile(file);
      onImportComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  }, [onImportComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleLocalImport = useCallback(async () => {
    setError(null);
    try {
      await api.importLocalFile();
      onImportComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    }
  }, [onImportComplete]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Your Health Data</h2>
          <p className="text-gray-600">
            Upload your Apple Health export to get started. Your data stays 100% local.
          </p>
        </div>

        {isImporting ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              {status?.status === 'computing' ? 'Computing summaries...' : 'Parsing health data...'}
            </p>
            <p className="text-gray-500 mt-2">
              {status?.records_imported.toLocaleString()} records processed
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status?.progress || 0}%` }}
              />
            </div>
          </div>
        ) : status?.status === 'complete' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Import Complete!</p>
            <p className="text-gray-500 mt-2">
              {status.records_imported.toLocaleString()} records imported
            </p>
            <button
              onClick={onImportComplete}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              View Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Drag and drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your <code className="bg-gray-100 px-1 rounded">export.xml</code> here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                Choose File
                <input
                  type="file"
                  accept=".xml"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {/* Alternative: import from data folder */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Already copied <code className="bg-gray-100 px-1 rounded">export.xml</code> to the{' '}
                    <code className="bg-gray-100 px-1 rounded">data/</code> folder?
                  </p>
                  <button
                    onClick={handleLocalImport}
                    className="mt-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Import from local file
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {status?.status === 'error' && status.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{status.error_message}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How to export from Apple Health</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Open the <strong>Health</strong> app on your iPhone</li>
          <li>Tap your <strong>profile picture</strong> in the top-right</li>
          <li>Scroll down and tap <strong>"Export All Health Data"</strong></li>
          <li>Confirm and wait for the export to complete</li>
          <li>Transfer the export to your computer (AirDrop, iCloud, USB)</li>
          <li>Unzip and upload the <code className="bg-gray-100 px-1 rounded">export.xml</code> file</li>
        </ol>
      </div>
    </div>
  );
}
