import React, { useState } from 'react';
import { useData } from '../DataContext';
import { FileText, Video, Link as LinkIcon, Download, Search, Plus, X } from 'lucide-react';

export default function ResourcesView() {
  const { resources, addResource, currentUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState<'PDF' | 'Video' | 'Link' | 'Doc'>('Link');

  const isLeader = currentUser?.role === 'Group Leader';

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="text-rose-500" />;
      case 'Video': return <Video className="text-blue-500" />;
      case 'Link': return <LinkIcon className="text-emerald-500" />;
      case 'Doc': return <FileText className="text-blue-600" />;
      default: return <FileText className="text-slate-500" />;
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link) return;
    addResource({ title, link, type });
    setIsModalOpen(false);
    setTitle('');
    setLink('');
    setType('Link');
  };

  const handleDownload = (link: string) => {
    // In a real app, this would trigger a download or open the link
    window.open(link === '#' ? 'https://example.com' : link, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resources</h2>
          <p className="text-slate-500 mt-1">Study materials and shared documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
          {isLeader && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Plus size={18} />
              Upload
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {getIcon(res.type)}
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {res.type}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{res.title}</h3>
            <p className="text-sm text-slate-500 mb-4 flex-1">Uploaded by {res.uploadedBy} • {res.date}</p>
            <button 
              onClick={() => handleDownload(res.link)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
            >
              <Download size={16} />
              {res.type === 'Link' || res.type === 'Video' ? 'Open Link' : 'Download'}
            </button>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Upload Resource</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Enter Resource Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link / URL</label>
                <input 
                  type="url" 
                  required
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Doc">Word Document</option>
                  <option value="Video">Video Tutorial</option>
                  <option value="Link">Web Link</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
