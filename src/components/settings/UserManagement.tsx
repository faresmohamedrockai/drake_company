import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Edit, Trash2, User, Shield, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Sales Rep' as UserType['role'],
    teamId: '',
    isActive: true,
    avatar: '', // <-- add avatar field
  });

  const { t } = useTranslation('settings');
  const { language } = useLanguage();

  // Get all team leaders for the dropdown
  const teamLeaders = users.filter(user => user.role === 'Team Leader' && user.isActive);
  
  // Check if there's already an admin user
  const existingAdmin = users.find(user => user.role === 'Admin' && user.isActive);
  const canCreateAdmin = !existingAdmin || (editingUser && editingUser.role === 'Admin');

  // Role-based permissions
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Sales Admin';
  const canDeleteUsers = currentUser?.role === 'Admin';
  const canEditUserRoles = currentUser?.role === 'Admin' || currentUser?.role === 'Sales Admin';
  const canCreateUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Sales Admin';

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent creating additional admin users
    if (!editingUser && formData.role === 'Admin' && existingAdmin) {
      alert(t('user.cannotCreateAdditionalAdmin'));
      return;
    }
    
    if (editingUser) {
      updateUser(editingUser.id, formData);
      setEditingUser(null);
    } else {
      addUser(formData);
    }
    
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'Sales Rep',
      teamId: '',
      isActive: true,
      avatar: '', // <-- add avatar field
    });
    setShowAddModal(false);
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      teamId: user.teamId || '',
      isActive: user.isActive,
      avatar: user.avatar || '', // <-- add avatar field
    });
    setShowAddModal(true);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Sales Admin': return 'bg-purple-100 text-purple-800';
      case 'Team Leader': return 'bg-blue-100 text-blue-800';
      case 'Sales Rep': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('accessDenied')}</h2>
          <p className="text-gray-600">{t('noPermissionToManageUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('userManagement')}</h2>
          <p className="text-gray-600">{t('manageSystemUsers')}</p>
          {existingAdmin && (
            <p className="text-sm text-orange-600 mt-1">
              {t('user.adminExists')}: {existingAdmin.name}
            </p>
          )}
        </div>
        {canCreateUsers && (
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                role: 'Sales Rep',
                teamId: '',
                isActive: true,
                avatar: '', // <-- add avatar field
              });
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('actions.addUser')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('user.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.username')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.created')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center mr-6 bg-blue-600 text-white font-semibold overflow-hidden border-2 border-blue-200">
                        {user.avatar ? (
                          <img src={user.avatar} alt="avatar" className="object-cover w-full h-full" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.teamId && <div className="text-sm text-gray-500">{t('team')}: {user.teamId}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? t('user.active') : t('user.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {canManageUsers && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title={t('actions.editUser')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteUsers && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title={t('actions.deleteUser')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? t('actions.editUser') : t('addNewUser')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center">
                <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200 shadow-md">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="avatar" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl text-blue-600 font-bold">{formData.name.charAt(0)}</span>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">{t('actions.edit')}</span>
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.fullName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    let newTeamId = formData.teamId;
                    
                    // Auto-update team ID for Team Leaders when name changes
                    if (formData.role === 'Team Leader') {
                      newTeamId = newName;
                    }
                    
                    setFormData({ ...formData, name: newName, teamId: newTeamId });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.username')}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserType['role'];
                    let newTeamId = formData.teamId;
                    
                    // Auto-set team ID to user's name for Team Leaders
                    if (newRole === 'Team Leader') {
                      newTeamId = formData.name;
                    } else if (newRole === 'Sales Rep') {
                      // Clear team ID for Sales Reps (they'll select from dropdown)
                      newTeamId = '';
                    }
                    
                    setFormData({ ...formData, role: newRole, teamId: newTeamId });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!canEditUserRoles}
                >
                  <option value="Sales Rep">{t('salesRep')}</option>
                  <option value="Team Leader">{t('teamLeader')}</option>
                  {currentUser?.role === 'Admin' && <option value="Sales Admin">{t('salesAdmin')}</option>}
                  {currentUser?.role === 'Admin' && canCreateAdmin && <option value="Admin">{t('admin')}</option>}
                </select>
                {!canEditUserRoles && (
                  <p className="text-xs text-gray-500 mt-1">{t('user.onlyAdminsCanChangeRoles')}</p>
                )}
                {!canCreateAdmin && existingAdmin && (
                  <p className="text-xs text-orange-600 mt-1">{t('user.onlyOneAdminAllowed')}</p>
                )}
              </div>

              {formData.role === 'Team Leader' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.teamId')}</label>
                  <input
                    type="text"
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder={t('user.autoSetToUserName')}
                    readOnly={formData.name === formData.teamId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.name === formData.teamId 
                      ? t('user.teamIdAutoSet') 
                      : t('user.canManuallyOverrideTeamId')
                    }
                  </p>
                </div>
              )}

              {formData.role === 'Sales Rep' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.teamLeader')}</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('user.selectTeamLeader')}</option>
                    {teamLeaders.map(leader => (
                      <option key={leader.id} value={leader.name}>
                        {leader.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t('user.selectTeamLeaderForSalesRep')}</p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">{t('user.activeUser')}</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? t('actions.updateUser') : t('actions.addUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;