// src/components/DrivePickerModal.tsx
import React, { useState, useEffect } from 'react';
import { FolderGit2, FileText, ExternalLink, X, Check, Search, Cloud } from 'lucide-react';
import { fetchDriveFiles } from '../lib/drive.ts';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: { name: string; url: string; mimeType: string }) => void;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({ isOpen, onClose, onSelectFile }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const list = await fetchDriveFiles();
      setFiles(list);
    } catch (err) {
      console.error('Failed to load Drive files:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="rounded-2xl max-w-lg w-full p-6 bg-white border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400">
            <Cloud className="w-5 h-5" />
            <h3 className="text-base font-bold">Google Drive File Picker</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your Google Drive files..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading Drive files...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No Google Drive files found.</div>
          ) : (
            filtered.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  onSelectFile({
                    name: file.name,
                    url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
                    mimeType: file.mimeType || 'application/octet-stream',
                  });
                  onClose();
                }}
                className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors rounded-xl"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <FileText className="w-5 h-5 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">{file.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{file.mimeType}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-semibold shrink-0 ml-2">
                  Attach
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
