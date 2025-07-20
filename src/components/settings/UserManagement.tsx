import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, Trash2, User, Shield, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';
import { validateEmail, getEmailErrorMessage } from '../../utils/emailValidation';

const UserManagement: React.FC<{ users: UserType[] }> = ({ users }) => {
  const { user: currentUser } = useAuth();
  const { isRTL, rtlClass, rtlMargin } = useLanguage();
  const { t } = useTranslation('settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toastId, setToastId] = useState<Id | null>(null);
  const [updateUserResponse, setUpdateUserResponse] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'sales_rep',
    teamLeaderId: '',
    image: '',
  });
  const [emailError, setEmailError] = useState('');
  const queryClient = useQueryClient();
  const { mutateAsync: updateUserMutation, isPending } = useMutation({
    mutationFn: (data: { id: string; formData: any }) => updateUser(data.id, data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.dismiss(toastId!);
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast.dismiss(toastId!);
      toast.error("Error updating user");
    }
  })
  const { mutateAsync: addUserMutation, isPending: isAdding } = useMutation({
    mutationFn: (data: { formData: any }) => addUser(data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'sales_rep',
        teamLeaderId: '',
        image: '',
      });
      setShowAddModal(false);
      toast.dismiss(toastId!);
      setToastId(toast.success(t('user.added')));
    },
    onError: (error: any) => {
      console.error('Error adding user:', error);
      toast.dismiss(toastId!);
      toast.error(error.response.data.message[0]);
    }
  })
  const { mutateAsync: deleteUserMutation, isPending: isDeleting } = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.dismiss(toastId!);
      toast.success("User deleted successfully");
    }
  })

  const addUser = async (formData: any) => {
    const response = await axiosInterceptor.post(`/auth/add-user`, formData);
    return response.data;
  }

  const updateUser = async (userId: string, formData: any) => {
    const response = await axiosInterceptor.patch(`/auth/update-user/${userId}`, formData);
    return response.data;
  }

  useEffect(() => {
    if (isAdding || isDeleting || isPending) {
      setToastId(toast.loading("Loading..."));
    }
  }, [isAdding, isDeleting, isPending]);

  const canManageUsers = currentUser?.role === 'admin';
  const canDeleteUsers = currentUser?.role === 'admin';

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setEditingUser(null);
  }, [updateUserResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Email validation
    if (!validateEmail(formData.email)) {
      setEmailError(getEmailErrorMessage(formData.email, isRTL ? 'ar' : 'en'));
      return;
    }

    // For team leaders, set their team ID to their own user ID (will be generated)
    const submitData = { ...formData };
    if (submitData.role === 'team_leader') {
      // For new users, we'll set this after user creation
      // For editing, we'll keep the existing team ID
      if (!editingUser) {
        submitData.teamLeaderId = 'auto-assign'; // Will be set to user ID after creation
      }
    }

    if (editingUser) {
      const response = await updateUserMutation({ id: editingUser.id, formData: submitData });
      setUpdateUserResponse(response);
    } else {
      addUserMutation({ formData: submitData });

    }


  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      teamLeaderId: user.teamLeaderId || '',
      image: user.image || '',
    });
    setShowAddModal(true);
  };

  const deleteUser = async (userId: string) => {
    const response = await axiosInterceptor.delete(`/auth/delete-user/${userId}`);
    return response.data;
  }

  // useEffect(() => {
  //   if (isDeleting) {
  //     toast.success(t('user.deleted'));
  //   }
  // }, [isDeleting]);

  const handleDelete = (userId: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      deleteUserMutation(userId);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sales_admin': return 'bg-purple-100 text-purple-800';
      case 'team_leader': return 'bg-blue-100 text-blue-800';
      case 'sales_rep': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return t('role.admin');
      case 'sales_admin': return t('role.salesAdmin');
      case 'team_leader': return t('role.teamLeader');
      case 'sales_rep': return t('role.salesRep');
      default: return role;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear email error when user types
    if (name === 'email') {
      setEmailError('');
    }
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'font-arabic' : ''}`}>{t('userManagement')}</h2>
          <p className={`text-gray-600 ${isRTL ? 'font-arabic' : ''}`}>{t('manageSystemUsers')}</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'sales_rep',
              teamLeaderId: '',
              image: '',
            });
            setShowAddModal(true);
          }}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <span className={isRTL ? 'font-arabic' : ''}>{t('actions.addUser')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className={`relative max-w-md ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
          <input
            type="text"
            placeholder={t('user.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'font-arabic' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.user')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.email')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.username')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.role')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.status')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.created')}
                </th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-arabic' : ''}`}>
                  {t('user.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'} bg-blue-600 text-white font-semibold overflow-hidden border-2 border-blue-200`}>
                        {user.image ? (
                          <img src={user.image} alt="avatar" className="object-cover w-full h-full" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'font-arabic' : ''}`}>{user.name}</div>
                        {user.teamId && <div className={`text-sm text-gray-500 ${isRTL ? 'font-arabic' : ''}`}>{t('team')}: {user.teamId}</div>}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{user.email}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{user.username}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)} ${isRTL ? 'font-arabic' : ''}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      } ${isRTL ? 'font-arabic' : ''}`}>
                      {user.isActive ? t('user.active') : t('user.inactive')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {new Date(user.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title={t('user.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {canDeleteUsers && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                          title={t('user.delete')}
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
          <div className={`bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {editingUser ? t('user.edit') : t('addNewUser')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center">
                <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200 shadow-md">
                    {formData.image ? (
                      <img src={formData.image} alt="avatar" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl text-blue-600 font-bold">{formData.name.charAt(0)}</span>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                      <span className={`text-white opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'font-arabic' : ''}`}>
                        {isRTL ? 'تعديل' : 'Edit'}
                      </span>
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
                        reader.readAsDataURL(file);
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, image: reader.result as string }));
                        };
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t('user.fullName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  name='name'
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                  // required
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t('user.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  name='email'
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isRTL ? 'font-arabic' : ''} ${
                    emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  // required
                  dir={isRTL ? 'rtl' : 'ltr'}
                  placeholder={isRTL ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </div>

              {/* <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t('user.username')}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div> */}

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t('user.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    name='password'
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 ${isRTL ? 'pr-10 pl-3' : 'pl-3 pr-10'} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                    // required
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {
                currentUser?.role === 'admin' && (

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t('user.role')}</label>
                    <select
                      value={formData.role}
                      name='role'
                      onChange={(e) => {
                        const newRole = e.target.value as UserType['role'];
                        let newTeamId = formData.teamLeaderId;

                        // If changing to team leader, set team ID to auto-assign
                        if (newRole === 'team_leader') {
                          newTeamId = editingUser ? editingUser.id : 'auto-assign';
                        } else if (newRole === 'sales_rep') {
                          // If changing to sales rep, clear team ID
                          newTeamId = '';
                        }

                        setFormData({ ...formData, role: newRole, teamLeaderId: newTeamId });
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="sales_rep">{t('role.salesRep')}</option>
                      <option value="team_leader">{t('role.teamLeader')}</option>
                      <option value="sales_admin">{t('role.salesAdmin')}</option>
                      <option value="admin">{t('role.admin')}</option>
                    </select>
                  </div>
                )
              }


              {/* Team ID for Sales Rep */}
              {formData.role === 'sales_rep' && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}>
                    {isRTL ? 'اسم قائد الفريق' : 'Team Leader Name'}
                  </label>
                  <select
                    value={formData.teamLeaderId}
                    onChange={handleInputChange}
                    name='teamLeaderId'
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    required
                  >
                    <option value="">{isRTL ? "اختر اسم قائد الفريق" : "Select team leader name"}</option>
                    {users
                      .filter(user => user.role === 'team_leader')
                      .map(teamLeader => (
                        <option key={teamLeader.id} value={teamLeader.id}>
                          {teamLeader.name} ({teamLeader.email})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}


              <div className={`flex justify-end space-x-3 pt-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
                >
                  {isPending ? t('actions.saving') : editingUser ? t('actions.updateUser') : t('actions.addUser')}
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
