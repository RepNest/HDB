// src/components/Settings/SubComponents/Privacy/PasswordsPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

type Credential = {
  id: string;
  site: string;
  username: string;
  password: string;
};

const PasswordsPage = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ site: '', username: '', password: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const creds = await window.electronAPI.loadEncryptedData('credentials');
      if (Array.isArray(creds)) {
        setCredentials(creds);
      }
    };
    fetchData();
  }, []);

  const toggleShow = (id: string) => {
    setShowPassword(prev => (prev === id ? null : id));
  };

  const handleDelete = async (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    setCredentials(updated);
    await window.electronAPI.saveEncryptedData('credentials', updated);
  };

  const handleAdd = async () => {
    const id = `${Date.now()}-${Math.random()}`;
    const updated = [...credentials, { ...newEntry, id }];
    setCredentials(updated);
    await window.electronAPI.saveEncryptedData('credentials', updated);
    setNewEntry({ site: '', username: '', password: '' });
  };

  const filtered = credentials.filter(c =>
    c.site.toLowerCase().includes(filter.toLowerCase()) ||
    c.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Saved Passwords</h2>

      <input
        type="text"
        placeholder="Search by site or username..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full p-2 rounded bg-neutral-700 text-white"
      />

      <div className="space-y-3">
        {filtered.map((cred) => (
          <div key={cred.id} className="bg-neutral-800 p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{cred.site}</div>
              <div className="text-sm text-gray-300">{cred.username}</div>
              <div className="text-sm">
                {showPassword === cred.id ? cred.password : '••••••••'}
                <button
                  className="ml-2 text-blue-400 hover:underline text-xs"
                  onClick={() => toggleShow(cred.id)}
                >
                  {showPassword === cred.id ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleDelete(cred.id)}
              className="text-red-400 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-600 pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-2">Add New Credential</h3>
        <input
          type="text"
          placeholder="Site"
          value={newEntry.site}
          onChange={e => setNewEntry({ ...newEntry, site: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-neutral-700 text-white"
        />
        <input
          type="text"
          placeholder="Username"
          value={newEntry.username}
          onChange={e => setNewEntry({ ...newEntry, username: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-neutral-700 text-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={newEntry.password}
          onChange={e => setNewEntry({ ...newEntry, password: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-neutral-700 text-white"
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 px-4 py-2 rounded text-white"
        >
          Save Credential
        </button>
      </div>
    </div>
  );
};

export default PasswordsPage;
