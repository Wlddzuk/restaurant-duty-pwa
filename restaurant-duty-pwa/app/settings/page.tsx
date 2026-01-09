/**
 * Settings Page - Staff & Manager Registry
 *
 * Allows managers to:
 * - Add new staff members
 * - Add new managers (with PIN setup)
 * - View all staff
 * - Deactivate/reactivate staff
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffRegistry } from '@/hooks/useStaffRegistry';
import type { StaffRole } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { activeStaff, activeManagers, addStaff, deactivateStaff, error } = useStaffRegistry();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('staff');
  const [newPin, setNewPin] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStaff = async () => {
    setAddError(null);

    if (!newName.trim()) {
      setAddError('Name is required');
      return;
    }

    if (newRole === 'manager' && !/^\d{4}$/.test(newPin)) {
      setAddError('Manager PIN must be exactly 4 digits');
      return;
    }

    setIsAdding(true);

    const result = await addStaff({
      name: newName.trim(),
      role: newRole,
      pin: newRole === 'manager' ? newPin : undefined,
    });

    setIsAdding(false);

    if (result) {
      // Success
      setShowAddModal(false);
      setNewName('');
      setNewPin('');
      setNewRole('staff');
    } else if (error) {
      setAddError(error);
    }
  };

  const allStaffList = [...activeStaff, ...activeManagers];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100
                     rounded-lg transition-colors touch-manipulation"
            aria-label="Back to home"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto">
        {/* Staff Registry Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Staff Registry</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                       rounded-xl font-medium hover:bg-blue-700 transition-colors
                       touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Person
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-900">{activeStaff.length}</div>
              <div className="text-sm text-blue-600">Staff Members</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-900">{activeManagers.length}</div>
              <div className="text-sm text-purple-600">Managers</div>
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Active Staff ({allStaffList.length})
            </h3>

            {allStaffList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No staff members yet. Add your first person above.
              </p>
            ) : (
              allStaffList.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl
                           hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center
                                text-white font-semibold ${
                                  person.role === 'manager' ? 'bg-purple-500' : 'bg-blue-500'
                                }`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{person.role}</div>
                    </div>
                  </div>

                  {person.role === 'manager' && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs
                                   font-medium rounded-full">
                      Manager
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* App Info */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">App Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Database</span>
              <span className="font-medium text-gray-900">IndexedDB (Local)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Sync Status</span>
              <span className="font-medium text-green-600">Online</span>
            </div>
          </div>
        </section>
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                   bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setAddError(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Person</h2>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                         focus:border-blue-500 focus:ring-4 focus:ring-blue-200
                         focus:outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNewRole('staff')}
                  className={`p-4 rounded-xl border-2 font-medium transition-all
                           touch-manipulation ${
                             newRole === 'staff'
                               ? 'border-blue-500 bg-blue-50 text-blue-700'
                               : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                           }`}
                >
                  Staff
                </button>
                <button
                  onClick={() => setNewRole('manager')}
                  className={`p-4 rounded-xl border-2 font-medium transition-all
                           touch-manipulation ${
                             newRole === 'manager'
                               ? 'border-purple-500 bg-purple-50 text-purple-700'
                               : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                           }`}
                >
                  Manager
                </button>
              </div>
            </div>

            {/* PIN Input (only for managers) */}
            {newRole === 'manager' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-purple-500 focus:ring-4 focus:ring-purple-200
                           focus:outline-none transition-all font-mono text-center text-2xl
                           tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This PIN will be required to authorize submissions
                </p>
              </div>
            )}

            {/* Error Message */}
            {addError && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {addError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                  setNewName('');
                  setNewPin('');
                }}
                className="flex-1 h-12 bg-gray-200 text-gray-700 rounded-xl font-medium
                         hover:bg-gray-300 transition-colors touch-manipulation"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={isAdding}
                className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-medium
                         hover:bg-blue-700 transition-colors touch-manipulation
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : `Add ${newRole === 'manager' ? 'Manager' : 'Staff'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
