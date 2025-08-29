import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';
import { validateEmail, getEmailErrorMessage } from '../../utils/emailValidation';

const UserManagement: React.FC<{ users: UserType[] }> = ({ users }) => {
  const { user: currentUser } = useAuth();
  const { isRTL, rtlClass, rtlMargin } = useLanguage();
  const { t } = useTranslation(['settings', 'common']);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignToId, setAssignToId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]); // عدل النوع حسب مشروعك
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [assignToMap, setAssignToMap] = useState<{ [key: string]: string }>({});
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
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


  const translateRole = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'مشرف';
      case 'SALES_ADMIN':
        return 'مدير مبيعات';
      case 'TEAM_LEADER':
        return 'قائد فريق';
      case 'SALES_REP':
        return 'مندوب مبيعات';
      case 'VIEWER':
        return 'مشاهد';
      default:
        return role;
    }
  };

  const [emailError, setEmailError] = useState('');
  const queryClient = useQueryClient();
  const { mutateAsync: updateUserMutation, isPending } = useMutation({
    mutationFn: (data: { id: string; formData: any }) => updateUser(data.id, data.formData),
    onSuccess: () => {
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.dismiss(toastId!);
      toast.success(t('common:userUpdatedSuccessfully'));
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast.dismiss(toastId!);
      toast.error(t('common:errorUpdatingUser'));
    }
  })

  const { mutateAsync: addUserMutation, isPending: isAdding } = useMutation({
    mutationFn: async (data: { formData: any }) => {
      const response = await addUser(data.formData);

      // If this is a team leader, update their teamId to their own ID
      if (data.formData.role === 'team_leader' && response.user) {
        await updateUser(response.user.id, { teamId: response.user.id });
      }

      return response;
    },
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

      // شيل أي toast مفتوح
      toast.dismiss(toastId!);

      // استخراج الرسالة من الرد أو من الخطأ نفسه
      const message =
        error?.response?.data?.message[0] ||
        error?.message ||
        'حدث خطأ غير متوقع';

      // عرضها في toast
      setToastId(toast.error(message));
    }
  })
  const { mutateAsync: deleteUserMutation, isPending: isDeleting } = useMutation({
    mutationFn: (userId: string) => deleteUser(userId, assignToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.dismiss(toastId!);
      toast.success(t('common:userDeletedSuccessfully'));
    }
  })

  const addUser = async (formData: any) => {
    const response = await axiosInterceptor.post(`/auth/add-user`, formData);
    return response.data;
  }


  const updateUser = async (userId: string, formData: any) => {

    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );

    console.log(filteredData);

    const response = await axiosInterceptor.patch(`/auth/update-user/${userId}`, filteredData);
    return response.data;
  };



  useEffect(() => {
    if (isAdding || isDeleting || isPending) {
      setToastId(toast.loading("Loading..."));
    }
  }, [isAdding, isDeleting, isPending]);




  const fetchAssignableUsers = async () => {
    try {
      const res = await axiosInterceptor.get('/auth/users');
      setAvailableUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };
  useEffect(() => {

    fetchAssignableUsers();
  }, []);

  const deleteUser = async (userId: string, assignToId: string) => {
    const response = await axiosInterceptor.delete(`/auth/delete-user/${userId}/leadsTo/${assignToId}`);
    await fetchAssignableUsers()
    return response.data;

  };

  const canManageUsers = currentUser?.role === 'admin';
  const canDeleteUsers = currentUser?.role === 'admin';

  // Helper function to get team members for a team leader
  // const getTeamMembers = (teamLeaderId: string) => {
  //   return users.filter(user => user.role === 'sales_rep' && user.teamLeaderId === teamLeaderId);
  // };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setEditingUser(null);
  }, [updateUserResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setShowAddModal(false);

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
        submitData.teamId = 'auto-assign'; // Will be set to user ID after creation
        submitData.teamLeaderId = null; // Team leaders don't have a team leader
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


    if (name === 'email') {
      setEmailError('');
    }
  }
  const OrgCard: React.FC<{ user: UserType; selectedUser?: UserType | null }> = ({ user, selectedUser }) => {
    const getRoleColor = (role: string) => {
      switch (role) {
        case 'admin': return 'bg-red-100 text-red-800';
        case 'sales_admin': return 'bg-purple-100 text-purple-800';
        case 'team_leader': return 'bg-blue-100 text-blue-800';
        case 'sales_rep': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const isSelected = selectedUser?.id === user.id;

    return (
      <div
        className={`flex flex-col items-center p-4 bg-white shadow rounded-lg border w-36 sm:w-40 transition
        ${isSelected ? 'ring-4 ring-blue-500 scale-105' : ''}`}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            user.name?.charAt(0)
          )}
        </div>
        {/* Name */}
        <p className="mt-2 text-sm font-semibold text-gray-900 text-center">
          {user.name}
        </p>
        {/* Role */}
        <span className={`mt-1 px-2 py-0.5 text-xs rounded-full ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      </div>
    );
  };


  const OrgChart: React.FC<{ users: UserType[]; selectedUser?: UserType | null }> = ({ users, selectedUser }) => {
    const admin = users.find((u) => u.role === "admin");
    const salesAdmins = users.filter((u) => u.role === "sales_admin");
    const teamLeaders = users.filter((u) => u.role === "team_leader");
    const salesReps = users.filter((u) => u.role === "sales_rep");

    return (
      <div className="flex flex-col items-center space-y-10 mt-10 w-full">
        {/* Admin */}
        {admin && <OrgCard user={admin} selectedUser={selectedUser} />}
        {admin && <div className="w-0.5 h-8 bg-gray-300"></div>}

        {/* Sales Admins */}
        {salesAdmins.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
            {salesAdmins.map((sa) => (
              <OrgCard key={sa.id} user={sa} selectedUser={selectedUser} />
            ))}
          </div>
        )}
        {salesAdmins.length > 0 && <div className="w-0.5 h-8 bg-gray-300"></div>}

        {/* Team Leaders + Sales Reps */}
        <div className="w-full overflow-x-auto">
          <div className="flex gap-10 justify-center min-w-max px-4">
            {teamLeaders.map((leader) => {
              const repsForLeader = salesReps.filter(
                (rep) => rep.teamLeader?.id === leader.id
              );

              return (
                <div
                  key={leader.id}
                  className="flex flex-col items-center space-y-6 min-w-[220px]"
                >
                  <OrgCard user={leader} selectedUser={selectedUser} />

                  {repsForLeader.length > 0 && (
                    <div className="w-0.5 h-6 bg-gray-300"></div>
                  )}

                  {/* Sales reps grid - 3 per row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {repsForLeader.map((rep) => (
                      <OrgCard
                        key={rep.id}
                        user={rep}
                        selectedUser={selectedUser}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };









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
                  {t('user.role')}
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
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)} ${isRTL ? 'font-arabic' : ''}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {new Date(user.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowOrgModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title={t('viewOrg')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>



                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title={t('user.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>


                      {canDeleteUsers && user.id !== currentUser?.id && (
                        <div className="flex flex-col gap-1 items-start">
                          {deletingUserId === user.id ? (
                            <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-white rounded-xl shadow-md border text-right">
                              <label className="text-sm font-semibold text-gray-700 w-full md:w-auto">
                                نقل المهام إلى مستخدم آخر:
                              </label>

                              <select
                                value={assignToMap[user.id] || ""}
                                onChange={(e) =>
                                  setAssignToMap((prev) => ({
                                    ...prev,
                                    [user.id]: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[200px]"
                              >
                                <option value="">Chose User </option>
                                {users
                                  .filter((u) => u.id !== user.id)
                                  .map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} ({translateRole(u.role)})
                                    </option>
                                  ))}
                              </select>

                              <div className="flex gap-2">
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                                  onClick={async () => {
                                    if (!assignToMap[user.id]) {
                                      toast.error('Please Chose Assgin To User First❌');
                                      return;
                                    }

                                    try {
                                      await deleteUser(user.id, assignToMap[user.id]);
                                      toast.success('User Deleted successfly');
                                      setDeletingUserId(null);
                                      fetchAssignableUsers();
                                    } catch (error: any) {
                                      const errorMessage = error?.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم';
                                      toast.error(`❌ ${errorMessage}`);
                                    }
                                  }}
                                >
                                  تأكيد الحذف
                                </button>

                                <button
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition"
                                  onClick={() => {
                                    setDeletingUserId(null);
                                    setAssignToMap((prev) => {
                                      const copy = { ...prev };
                                      delete copy[user.id];
                                      return copy;
                                    });
                                  }}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>

                          ) : (
                            <button
                              onClick={() => setDeletingUserId(user.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          )}

                        </div>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Org Chart Section */}
      {showOrgModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('Organizational Chart')} - {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Org Chart */}
            <OrgChart users={users} selectedUser={selectedUser} />
          </div>
        </div>
      )}



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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isRTL ? 'font-arabic' : ''} ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  // required
                  dir={isRTL ? 'rtl' : 'ltr'}
                  placeholder={isRTL ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </div>


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
                          setFormData({ ...formData, role: newRole, teamId: newTeamId, teamLeaderId: null });
                        } else if (newRole === 'sales_rep') {
                          // If changing to sales rep, clear team ID
                          newTeamId = '';
                          setFormData({ ...formData, role: newRole, teamId: '', teamLeaderId: newTeamId });
                        } else {
                          setFormData({ ...formData, role: newRole, teamLeaderId: newTeamId });
                        }
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
                  <label
                    className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'font-arabic' : ''}`}
                  >
                    {isRTL ? 'اسم قائد الفريق' : 'Team Leader Name'}
                  </label>
                  <select
                    value={formData.teamLeaderId}
                    onChange={handleInputChange}
                    name="teamLeaderId"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'font-arabic' : ''}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    required
                  >
                    <option value="">{t('common:selectTeamLeaderName')}</option>
                    {users
                      .filter((user) => user.role === "team_leader")
                      .map((teamLeader) => (
                        <option key={teamLeader.id} value={teamLeader.id}>
                          {teamLeader.name} ({teamLeader.email})
                        </option>
                      ))}
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
                  onClick={() => {
                  }}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
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