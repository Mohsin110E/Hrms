import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getDepartments, getSites, getDocumentTypes, getLanguages, getShifts } from '../lib/api';

type MasterTab = 'departments' | 'sites' | 'languages' | 'shifts' | 'document-types';

export default function MastersPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<MasterTab>('departments');
  const [departments, setDepartments] = useState<{ id: number; name: string; isActive: boolean }[]>([]);
  const [sites, setSites] = useState<{ id: number; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: number; name: string }[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([
      getDepartments({ isActive: true }),
      getSites(),
      getLanguages(),
      getShifts(),
      getDocumentTypes(),
    ])
      .then(([d, s, l, sh, dt]) => {
        setDepartments(d.data);
        setSites(s.data);
        setLanguages(l.data);
        setShifts(sh.data);
        setDocumentTypes(dt.data);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const tabs: { key: MasterTab; label: string }[] = [
    { key: 'departments', label: 'Departments' },
    { key: 'sites', label: 'Sites' },
    { key: 'languages', label: 'Languages' },
    { key: 'shifts', label: 'Shifts' },
    { key: 'document-types', label: 'Document Types' },
  ];

  const renderList = (items: { id: number; name: string }[]) => (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.id} className="py-3 px-4 flex items-center justify-between hover:bg-gray-50">
          <span className="font-medium text-gray-800">{item.name}</span>
          <span className="text-xs text-gray-400">ID: {item.id}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Masters</h2>
        <p className="text-gray-500 mt-1">Manage reference data and catalogs.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
          ) : (
            <>
              {activeTab === 'departments' && renderList(departments)}
              {activeTab === 'sites' && renderList(sites)}
              {activeTab === 'languages' && renderList(languages)}
              {activeTab === 'shifts' && renderList(shifts)}
              {activeTab === 'document-types' && renderList(documentTypes)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
