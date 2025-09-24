import React, { useEffect, useState, useMemo } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, Phone, Calendar, Plus, DollarSign, MapPin, Clock, Bot, Home, UserPlus,Shuffle } from 'lucide-react';
import { Lead, CallLog, VisitLog, Property, LeadStatus, Interest, Tier } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Project } from '../inventory/ProjectsTab';
import { Id, toast } from 'react-toastify';

import { PhoneNumber } from '../ui/PhoneNumber';


interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}


interface Agent {
  name: string;
}

interface Transfer {
  id: string | number;
  fromAgent: Agent;
  toAgent: Agent;
  transferType?: string;
  notes?: string;
  createdAt: string;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['leads', 'common']);
  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [aiTips, setAiTips] = useState<any>(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  const [callForm, setCallForm] = useState({
    date: new Date().toISOString().split('T')[0],
    outcome: '',
    followUpTime: '',
    followUpDate: '',
    duration: '',
    project: '',
    notes: ''
  });
  const [visitForm, setVisitForm] = useState<VisitLog>({
    inventoryId: '',
    id: '',
    leadId: '',
    createdBy: '',
    date: new Date().toISOString().split('T')[0],
    project: '',
    status: '',
    objections: '',
    notes: ''
  } as VisitLog);
  // console.log(i18n);


  const [descriptionForm, setDescriptionForm] = useState({
    text: lead?.description || "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentLead, setCurrentLead] = useState(lead);
  const [isUpdating, setIsUpdating] = useState(false);


  const [notes, setNotes] = useState<string[]>(lead.notes || []);

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // فوق داخل الكمبوننت
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  // مثال دالة لحذف رقم
  const handleDeletePhone = (index: number) => {
    const updatedPhones = currentLead.contacts?.filter((_, i) => i !== index);
    // هنا لازم تحدث البيانات في الـ backend كمان
    updateLead({ ...currentLead, contacts: updatedPhones });
  };

  // مثال دالة لإضافة رقم جديد
  const handleAddPhone = () => {
    if (!newPhone.trim()) return;
    const updatedPhones = [...(currentLead.contacts || []), newPhone.trim()];
    updateLead({ ...currentLead, contacts: updatedPhones });
    setNewPhone("");
    setShowPhoneForm(false);
  };






  console.log(lead);









  useEffect(() => {
    setNotes(lead.notes || []);
  }, [lead.notes]);



  const queryClient = useQueryClient();
  const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    return response.data.properties as Property[];
  }
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  }
  const getCalls = async () => {
    const response = await axiosInterceptor.get(`/calls/${currentLead.id}`);
    return response.data.data as CallLog[];
  }
  const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');
    return response.data.leads as Lead[];
  }
  const getVisits = async () => {
    const response = await axiosInterceptor.get(`/visits/${currentLead.id}`);
    return response.data.visits as VisitLog[];
  }
  const { data: leads, isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getLeads()
  });
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });



  const { mutate: updateLead, isPending: isUpdatingLead } = useMutation({
    mutationFn: (lead: Lead) => axiosInterceptor.patch(`/leads/${lead.id}`, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.dismiss(toastId!);
      toast.success(t('common:lead Updated Successfully'));
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast.dismiss(toastId!);
      toast.error(error.response.data.message || "Error updating lead");
    }
  });






  const { mutate: addCallLog, isPending: isCreatingCall } = useMutation({
    mutationFn: (call: CallLog) => axiosInterceptor.post(`/calls/create/${currentLead.id}`, call),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`calls-${currentLead.id}`] });
      queryClient.invalidateQueries({ queryKey: ["notificationData"] });
      setCallForm({
        date: new Date().toISOString().split('T')[0],
        outcome: '',
        followUpTime: '',
        followUpDate: '',
        duration: '',
        project: '',
        notes: ''
      });
      setShowCallForm(false);
      toast.success(t('common:callLogAddedSuccessfully'));
    },
    onError: (error: any) => {
      console.error('Error adding call log:', error);
      toast.error(error.response.data.message[0] || "Error adding call log");
    }
  });
  const { mutate: addVisitLog, isPending: isCreatingVisit } = useMutation({
    mutationFn: (visit: VisitLog) => axiosInterceptor.post(`/visits/create/${currentLead.id}`, visit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`visits-${currentLead.id}`] });
      setVisitForm({
        inventoryId: '',
        id: '',
        type: 'site_visit',
        meettingId: '',
        leadId: '',
        createdBy: '',
        date: new Date().toISOString().split('T')[0],
        project: '',
        status: '',
        objections: '',
        // type:"",
        notes: ''
      });
      setShowVisitForm(false);
      toast.success(t('common:visitLogAddedSuccessfully'));
    },
    onError: (error: any) => {
      console.error('Error adding visit log:', error);
      toast.error(error.response.data.message[0] || "Error adding visit log");
    }
  });




  const { data: calls, isLoading: isLoadingCalls } = useQuery<CallLog[]>({
    queryKey: [`calls-${currentLead.id}`],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getCalls()
  });
  const { data: visits, isLoading: isLoadingVisits } = useQuery<VisitLog[]>({
    queryKey: [`visits-${currentLead.id}`],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getVisits()
  });


  const [visitsSt, setVisits] = useState<VisitLog[]>([])




  // Sync currentLead with prop lead and refreshKey
  React.useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  React.useEffect(() => {
    // On refresh, get the latest lead data by ID
    const latest = leads?.find(l => l.id === currentLead.id);
    if (latest) setCurrentLead(latest);
    setIsUpdating(false);
  }, [refreshKey]);

  const canEdit = user?.role === 'admin' || user?.role === 'sales_admin' ||
    user?.role === 'team_leader' ||
    (user?.role === 'sales_rep' && (currentLead.assignedToId === user.id || currentLead.ownerId === user.id || currentLead.owner?.id === user.id));

  const [isUpdate, setIsUpdate] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');




  // Main progress stages (excluding special statuses and cancellation)
  const mainStatusStages = [
    { id: 'fresh', label: t('freshLead'), value: LeadStatus.FRESH_LEAD },
    { id: 'follow', label: t('followUp'), value: LeadStatus.FOLLOW_UP },
    { id: 'visit', label: t('scheduledVisit'), value: LeadStatus.SCHEDULED_VISIT },
    { id: 'vip', label: t('VIP'), value: LeadStatus.VIP },
    // { id: 'non_stop', label: t('nonStop'), value: LeadStatus.NON_STOP },
    { id: 'open', label: t('openDeal'), value: LeadStatus.OPEN_DEAL },
    { id: 'reservation', label: t('reservation'), value: LeadStatus.RESERVATION },
    { id: 'closed', label: t('closedDeal'), value: LeadStatus.CLOSED_DEAL },
  ];

  // Special statuses that show as single step
  const specialStatuses = [
    { id: 'notAnswered', label: t('noAnswer'), value: LeadStatus.NO_ANSWER },
    { id: 'notInterested', label: t('notInterestedNow'), value: LeadStatus.NOT_INTERSTED_NOW },
  ];

  // const getStatusColor = useMemo(() => (status: string) => {
  //   switch (status) {
  //     case LeadStatus.FRESH_LEAD: return 'bg-blue-100 text-blue-800';
  //     case LeadStatus.FOLLOW_UP: return 'bg-yellow-100 text-yellow-800';
  //     case LeadStatus.SCHEDULED_VISIT: return 'bg-purple-100 text-purple-800';
  //     case LeadStatus.OPEN_DEAL: return 'bg-green-100 text-green-800';
  //     case LeadStatus.VIP: return 'bg-green-100 text-yellow-800';
  //     case LeadStatus.NON_STOP: return 'bg-green-100 text-green-800';
  //     case LeadStatus.CANCELLATION: return 'bg-red-100 text-red-800';
  //     case LeadStatus.NO_ANSWER: return 'bg-orange-100 text-orange-800';
  //     case LeadStatus.NOT_INTERSTED_NOW: return 'bg-gray-200 text-gray-800';
  //     case LeadStatus.RESERVATION: return 'bg-pink-100 text-pink-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // }, []);
  // const getStatusColorInterst = useMemo(() => (status: string) => {
  //   switch (status) {
  //     case Interest.UNDER_DECISION: return 'bg-blue-100 text-blue-800';
  //     case Interest.HOT: return 'bg-yellow-100 text-yellow-800';
  //     case Interest.WARM: return 'bg-purple-100 text-purple-800';

  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // }, []);

  // const getStatusColorTier = useMemo(() => (status: string) => {
  //   switch (status) {
  //     case Tier.BRONZE: return 'bg-blue-100 text-blue-800';
  //     case Tier.GOLD: return 'bg-yellow-100 text-yellow-800';
  //     case Tier.PLATINUM: return 'bg-purple-100 text-purple-800';
  //     case Tier.SILVER: return 'bg-green-100 text-green-800';

  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // }, []);

  const [toastId, setToastId] = useState<Id | null>(null);
  const isCancelled = currentLead.status === LeadStatus.CANCELLATION;
  const isSpecialStatus = [LeadStatus.NO_ANSWER, LeadStatus.NOT_INTERSTED_NOW].includes(currentLead.status);


  // Get current status index for main stages (cancellation is not in main stages)
  const currentStatusIndex = mainStatusStages.findIndex(s => s.value === currentLead.status);

  // Get current special status
  const currentSpecialStatus = specialStatuses.find(s => s.value === currentLead.status);

  const handleStatusUpdate = (newStatus: Lead['status']) => {
    if (!canEdit) return;
    setIsUpdate(true);

    const formattedLead: Partial<Lead> = {
      id: currentLead.id, // لو backend محتاج ID
      status: newStatus,
    };

    // لو حابب تبعت firstConection
    if (currentLead.firstConection) {
      const firstDate =
        typeof currentLead.firstConection === 'string'
          ? new Date(currentLead.firstConection)
          : currentLead.firstConection;

      // نتأكد إنه صحيح
      if (!isNaN(firstDate.getTime())) {
        (formattedLead as any).firstConection = firstDate;
      }
    }

    updateLead(formattedLead as Lead);
    setCurrentLead((prev) => ({ ...prev, status: newStatus }));
  };




  useEffect(() => {
    if (isUpdatingLead) {

      setToastId(toast.loading(t('common:updatingLead')));
    }
  }, [isUpdatingLead]);

  // useEffect(() => {
  //   setIsUpdate(true);
  // }, [currentLead.status]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case LeadStatus.FRESH_LEAD: return 'bg-blue-100 text-blue-800';
      case LeadStatus.FOLLOW_UP: return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.SCHEDULED_VISIT: return 'bg-purple-100 text-purple-800';
      case LeadStatus.OPEN_DEAL: return 'bg-green-100 text-green-800';
      case LeadStatus.VIP: return 'bg-green-100 text-yellow-800';
      case LeadStatus.NON_STOP: return 'bg-green-100 text-green-800';
      case LeadStatus.CANCELLATION: return 'bg-red-100 text-red-800';
      case LeadStatus.NO_ANSWER: return 'bg-orange-100 text-orange-800';
      case LeadStatus.NOT_INTERSTED_NOW: return 'bg-gray-200 text-gray-800';
      case LeadStatus.RESERVATION: return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColorInterst = useMemo(() => (status: string) => {
    switch (status) {
      case Interest.UNDER_DECISION: return 'bg-blue-100 text-blue-800';
      case Interest.HOT: return 'bg-yellow-100 text-yellow-800';
      case Interest.WARM: return 'bg-purple-100 text-purple-800';

      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColorTier = useMemo(() => (status: string) => {
    switch (status) {
      case Tier.BRONZE: return 'bg-blue-100 text-blue-800';
      case Tier.GOLD: return 'bg-yellow-100 text-yellow-800';
      case Tier.PLATINUM: return 'bg-purple-100 text-purple-800';
      case Tier.SILVER: return 'bg-green-100 text-green-800';

      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);





  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault();
    const newCall = {
      ...callForm,
      createdBy: user?.name || '',
      leadId: lead.id // add required leadId
    };
    addCallLog(newCall as unknown as CallLog);
  };






  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit = {
      ...visitForm,
      createdById: user?.id
      ,
      createdBy: user?.name || '',
      leadId: lead.id! // add required leadId
    };
    addVisitLog(newVisit);
  };










  const handleAddNote = () => {
    if (newNote.trim()) {
      setIsUpdate(true);
      setNotes([
        ...notes,
        newNote
      ]);
      setNewNote('');
    }
  };


  const [loading, setLoading] = useState(false)



  const handelChange = async (e, visit: VisitLog) => {
    const isChecked = e.target.checked;

    if (loading) return;
    setLoading(true);

    // 👇 يبدأ بـ Loading
    // const toastId = toast.loading("Updating status... ⏳");

    try {
      const res = await axiosInterceptor.patch(
        `${import.meta.env.VITE_BASE_URL}/api/visits/${visit.id}`,
        {
          status: isChecked ? "Completed" : "pending",
          type: "site_visite",
          meettingId: visit.meettingId,
        }
      );

      if (res.status === 200) {
        // 👇 يتحول لنجاح ويقفل بعد ثانيتين
        toast.success("Status Changed Successfully ✅", {
          id: toastId,
          duration: 2000,
        });

        const updatedVisits = await getVisits();
        setVisits(updatedVisits as VisitLog[]);
      }
    } catch (err: any) {
      // 👇 يتحول لفشل ويقفل بعد ثانيتين
      toast.error(err?.response?.data?.message || "Failed to update visit ❌", {
        id: toastId,
        duration: 2000,
      });
      console.error("Error updating visit:", err);
    } finally {
      setLoading(false);
    }
  };










  useEffect(() => {
    if (isUpdate) {
      setIsUpdate(false);
    }
  }, [isUpdate]);

  useEffect(() => {


    // تعديل الدالة لتقبل أي جزء من الـ Lead
    const updateLeadNote = async (leadId: string, data: Partial<Lead>) => {
      try {
        await axiosInterceptor.patch(`/leads/${leadId}`, data);
      } catch (err) {
        console.error('Error updating lead', err);
      }
    };
    if (isUpdate) {
      updateLeadNote(lead!.id, { notes });; // ابعت الملاحظات فقط
    }
  }, [notes]);

  const handleEditNote = (index: number) => {
    setEditingNoteIndex(index);
    setEditingNoteValue(notes[index]);
  };

  const handleSaveEditNote = () => {
    if (editingNoteIndex !== null && editingNoteValue.trim()) {
      const updatedNotes = [...notes];
      updatedNotes[editingNoteIndex] = editingNoteValue;
      setNotes(updatedNotes);
      setEditingNoteIndex(null);
      setEditingNoteValue('');
      setIsUpdate(true);
    }
  };





  // const handleSaveDescription = async () => {
  //   if (!selectedLead) return;

  //   setIsSavingDescription(true);
  //   try {
  //     await onUpdateLead(selectedLead.id, { description: editedDescription });
  //     setIsEditingDescription(false);
  //   } catch (error) {
  //     console.error("Error saving description:", error);
  //   } finally {
  //     setIsSavingDescription(false);
  //   }
  // };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    // لو التاريخ بالصيغة dd/MM/yyyy
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(`${year}-${month}-${day}`);
    }
    // fallback: حاول تحوّله عادي
    return new Date(dateStr);
  };


const getActivities = (lead: any) => {
  const activities: any = [];

  // دالة مساعدة لتجنب التكرار
  const getUserName = (activityObject: any, fallback: string = 'Unknown User') => {
    return (
      activityObject?.createdByUser?.name ||
      activityObject?.createdBy?.name ||
      activityObject?.owner?.name ||
      fallback
    );
  };

  // Lead Created
  if (lead?.createdAt) {
    activities.push({
      id: `lead-created-${lead.id}`,
      type: "lead_created",
      title: "Lead Created",
      description: `Lead was initially created in the system.`,
      date: parseDate(lead.createdAt),
      userName: getUserName(lead, "System"),
      icon: <UserPlus size={18} />,
      color: "bg-gray-100 text-gray-600",
    });
  }

  // Calls
  lead?.calls?.forEach((call: any) => {
    activities.push({
      id: call.id,
      type: "call",
      title: "Phone Call Made",
      description: call.notes?.trim() || "Discussed project details.",
      date: parseDate(call.date),
      userName: getUserName(call),
      icon: <Phone size={18} />,
      color: "bg-blue-100 text-blue-600",
    });
  });

  // Meetings
  lead?.meetings?.forEach((meeting: any) => {
    activities.push({
      id: meeting.id,
      type: "meeting",
      title: "Meeting Scheduled",
      description: meeting.notes?.trim() || "Meeting with client.",
      date: parseDate(meeting.date),
      userName: getUserName(meeting),
      icon: <Calendar size={18} />,
      color: "bg-green-100 text-green-600",
    });
  });

  // Visits
  lead?.visits?.forEach((visit: any, index: number) => {
    activities.push({
      id: `visit-${index}`,
      type: "visit",
      title: "Site Visit",
      description: visit.notes?.trim() || "Client visited project location.",
      date: parseDate(visit.date),
      userName: getUserName(visit),
      icon: <Home size={18} />,
      color: "bg-purple-100 text-purple-600",
    });
  });

  // Transfers
  lead?.transfers?.forEach((transfer: any) => {
    activities.push({
      id: transfer.id,
      type: "transfer",
      title: "Lead Transferred",
      description: `Lead transferred from ${transfer.fromAgent?.name || "Unknown"} to ${transfer.toAgent?.name || "Unknown"} (${transfer.transferType}).`,
      date: parseDate(transfer.createdAt),
      userName: transfer.fromAgent?.name || "System", // مين اللي عمل الـ transfer
      icon: <Shuffle size={18} />, // من مكتبة lucide-react
      color: "bg-orange-100 text-orange-600",
    });
  });

  // Sort by date (newest first)
  return activities.sort(
    (a, b) =>
      (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0)
  );
};




  const handleCancelEditNote = () => {
    setEditingNoteIndex(null);
    setEditingNoteValue('');
  };

  const handleDeleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    setIsUpdate(true);
  };



  // Add update button handler
  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => setRefreshKey(k => k + 1), 600); // Simulate loading
  };

  // console.log(leads);

  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDescription(true);

    try {
      // ابعت الوصف للـ backend (update lead)
      await updateLead({
        ...lead,
        description: descriptionForm.text,
      });

      // حدّث الـ state المحلي
      setCurrentLead({ ...currentLead, description: descriptionForm.text });

      // قفل المودال
      setShowDescriptionForm(false);
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setIsSavingDescription(false);
    }
  };





  const fetchAiTips = async () => {
    try {
      setLoadingTips(true);
      const res = await axiosInterceptor.get(`/ai/tip-lead/${lead.id}`);
      // console.log(res.data);

      setAiTips(res.data);
      console.log(aiTips);

      // const resopnd=res.data
      // console.log(resopnd)
    } catch (err) {
      console.error("Error fetching AI tips", err);
    } finally {
      setLoadingTips(false);
      // setAiTips("");
    }
  };



  function getLastOrNextMeeting(meetings: any[]) {
    if (!meetings || meetings.length === 0) return null;

    const today = new Date().toISOString().split("T")[0];

    // رتب الميتنجات
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // آخر ميتنج في الليست
    const last = sorted[sorted.length - 1];

    // حدد هل هو last ولا next
    const type = last.date < today ? "Last Meeting" : "Next Meeting";

    return { ...last, type };
  }

  // 👇 جوه الكومبوننت
  const meetingInfo = getLastOrNextMeeting(currentLead.meetings || []);

  if (!isOpen) return null;


  // if(loading) return toast.loading("loading....");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-[98vh] sm:h-[95vh] overflow-y-auto relative shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 md:p-6 flex justify-between items-center z-10 rounded-t-lg sm:rounded-t-xl">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate pr-2">{t('leadDetails')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 -m-1 sm:-m-2 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Lead Details */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-b border-gray-200">
          <div className='border border-[#A7A9AC] rounded-xl p-3 sm:p-4 mb-6 sm:mb-9'>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4'>
              <div className="flex-1 min-w-0">
                <h1 className='text-black font-bold text-lg sm:text-xl md:text-2xl break-words'>{currentLead.nameAr?.toUpperCase()}</h1>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-[#A7A9AC] mt-2'>
                  <p className='flex items-center gap-2 flex-wrap'>
                    <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                    <span className="break-words">First Contact: {currentLead.firstConection ? currentLead.firstConection : "N/A"}</span>
                  </p>
                  <p className='flex items-center gap-2 flex-wrap'>
                    <Clock className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                    <span className="break-words">Last Contact: {
                      lead.calls && lead.calls.length > 0
                        ? new Date(lead.calls[lead.calls.length - 1].date).toLocaleDateString()
                        : "N/A"
                    }</span>
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap gap-2 sm:gap-3 lg:gap-5 justify-start sm:justify-end'>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)} truncate max-w-full`}
                  title={lead.status}
                >
                  {lead.status}
                </span>

                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorInterst(lead.interest)} truncate max-w-full`}
                  title={lead.interest.toString()}
                >
                  {lead.interest}
                </span>

                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate max-w-full ${getStatusColorTier(lead.tier)} `}
                  title={lead.tier.toString()}
                >
                  {lead.tier}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate max-w-full bg-[#23272F1A] text-black `}
                  title={lead.cil ? "true" : "false"}
                >
                  CIL: {lead.cil ? t("clear").toUpperCase() : t("not_clear").toUpperCase()}

                </span>

              </div>




            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Phone */}
            <div className="flex flex-row items-center p-3 sm:p-4 border rounded-xl bg-gray-50 gap-3 sm:gap-4">
              <Phone size={20} className="text-blue-500 flex-shrink-0 sm:w-6 sm:h-6" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-gray-500 text-xs sm:text-sm">Phone</span>
                <div className="font-medium text-gray-900 text-sm sm:text-base break-words">
                  {currentLead.contact ? (
                    <PhoneNumber phone={currentLead.contact} />
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="flex flex-row items-center p-3 sm:p-4 border rounded-xl bg-gray-50 gap-3 sm:gap-4">
              <DollarSign size={20} className="text-green-500 flex-shrink-0 sm:w-6 sm:h-6" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-gray-500 text-xs sm:text-sm">Budget</span>
                <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                  {" "}
                  {currentLead.budget && Number(currentLead.budget) > 0
                    ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "EGP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Number(currentLead.budget))
                    : "0"}
                </span>
              </div>
            </div>

            {/* Project */}
            <div className="flex flex-row items-center p-3 sm:p-4 border rounded-xl bg-gray-50 gap-3 sm:gap-4">
              <MapPin size={20} className="text-red-500 flex-shrink-0 sm:w-6 sm:h-6" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-gray-500 text-xs sm:text-sm">Project</span>
                <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                  {currentLead.projectInterest?.nameEn || currentLead.projectInterest?.nameAr || currentLead.otherProject || "N/A"}
                </span>
              </div>
            </div>
            <div className="relative">
              {/* ✅ الـ Badge فوق الكارد */}
              <div
                className={`absolute -top-2 left-2 px-3 py-1 text-xs font-semibold rounded-full shadow-md
                  ${meetingInfo
                    ? meetingInfo.type === "Last Meeting"
                      ? "bg-green-100 text-green-700"
                      : "bg-purple-100 text-purple-700"
                    : "bg-gray-200 text-gray-600"
                  }`}
              >
                {meetingInfo ? meetingInfo.type : "No Meeting Created"}
              </div>

              {/* ✅ الكارد نفسها */}
              <div className="flex flex-row items-center p-3 sm:p-4 border rounded-xl bg-gray-50 gap-3 sm:gap-4 min-h-[80px]">
                <Clock
                  size={20}
                  className={`flex-shrink-0 sm:w-6 sm:h-6 ${meetingInfo
                    ? meetingInfo.type === "Last Meeting"
                      ? "text-green-500"
                      : "text-purple-500"
                    : "text-gray-400"
                    }`}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {meetingInfo ? meetingInfo.type : "N/A"}
                  </span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {meetingInfo
                      ? `${meetingInfo.date} - ${meetingInfo.location || "N/A"}`
                      : "No details available"}
                  </span>
                </div>
              </div>
            </div>





          </div>



          {/* Redesigned Deal Progress Tracker */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4 text-center w-full">{t('dealProgress')}</label>

            <div className="relative w-full bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none p-2 sm:p-3 md:p-0">
              <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 md:gap-3 overflow-x-auto py-2 sm:py-4 px-1 sm:px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {isSpecialStatus && currentSpecialStatus ? (
                  // Show single step for special statuses
                  <div className="flex items-center min-w-max">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center relative flex-shrink-0"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base lg:text-lg font-bold border-2 sm:border-3 transition-all duration-300 bg-orange-500 border-orange-500 text-white shadow-lg">
                        !
                      </div>
                      <div className="mt-1 sm:mt-2 text-center w-12 sm:w-16 md:w-20 lg:w-24 text-orange-600">
                        <div className="text-xs sm:text-sm font-medium leading-tight">{currentSpecialStatus?.label || 'Unknown Status'}</div>
                        {i18n.language === 'ar' && (
                          <div className="text-xs sm:text-sm font-arabic mt-1 opacity-80 leading-tight">
                            {(() => {
                              switch (currentSpecialStatus?.value) {
                                case LeadStatus.NO_ANSWER:
                                  return 'لا يوجد رد';
                                case LeadStatus.NOT_INTERSTED_NOW:
                                  return 'غير مهتم الآن';
                                default:
                                  return '';
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  // Show main progress stages
                  <div className="flex items-center min-w-max">
                    {mainStatusStages.map((stage, index) => {
                      const isCompleted = index < currentStatusIndex;
                      const isActive = index === currentStatusIndex;
                      return (
                        <React.Fragment key={stage.id}>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`flex flex-col items-center relative flex-shrink-0`}
                          >
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base lg:text-lg font-bold border-2 sm:border-3 transition-all duration-300 shadow-lg
                                ${isCancelled ? 'bg-red-500 border-red-500 text-white' :
                                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                    isActive ? 'bg-blue-600 border-blue-600 text-white shadow-xl' :
                                      'bg-gray-200 border-gray-300 text-gray-600'}
                              `}
                            >
                              {index + 1}
                            </div>
                            <div className={`mt-1 sm:mt-2 text-center w-12 sm:w-16 md:w-20 lg:w-24 leading-tight
                              ${isCancelled ? 'text-red-600' :
                                isCompleted ? 'text-green-600' :
                                  isActive ? 'text-blue-600 font-semibold' :
                                    'text-gray-500'}
                            `}>
                              {i18n.language === 'ar' ? (
                                // Arabic layout: optimized for mobile
                                <div className="flex flex-col items-center justify-center">
                                  <div className="text-xs sm:text-sm font-arabic font-medium leading-tight text-center">
                                    {(() => {
                                      switch (stage.value) {
                                        case LeadStatus.FRESH_LEAD:
                                          return 'عميل محتمل جديد';
                                        case LeadStatus.FOLLOW_UP:
                                          return 'متابعة';
                                        case LeadStatus.SCHEDULED_VISIT:
                                          return 'زيارة مجدولة';
                                        case LeadStatus.OPEN_DEAL:
                                          return 'صفقة مفتوحة';
                                        case LeadStatus.VIP:
                                          return '(عميل نشط) عميل مهم ';

                                        case LeadStatus.RESERVATION:
                                          return 'حجز';
                                        case LeadStatus.CLOSED_DEAL:
                                          return 'صفقة مغلقة';
                                        default:
                                          return '';
                                      }
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                // English layout: optimized for mobile
                                <div className="flex flex-col items-center">
                                  <div className="text-xs sm:text-sm font-medium leading-tight text-center">{stage.label}</div>
                                  <div className="text-xs sm:text-sm font-arabic opacity-70 mt-1 leading-tight text-center">
                                    {(() => {
                                      switch (stage.value) {
                                        case LeadStatus.FRESH_LEAD:
                                          return 'عميل محتمل جديد';
                                        case LeadStatus.FOLLOW_UP:
                                          return 'متابعة';
                                        case LeadStatus.SCHEDULED_VISIT:
                                          return 'زيارة مجدولة';
                                        case LeadStatus.OPEN_DEAL:
                                          return 'صفقة مفتوحة';
                                        case LeadStatus.VIP:
                                          return 'عميل مهم (عميل نشط)';

                                        case LeadStatus.RESERVATION:
                                          return 'حجز';
                                        case LeadStatus.CLOSED_DEAL:
                                          return 'صفقة مغلقة';
                                        default:
                                          return '';
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                          {index < mainStatusStages.length - 1 && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: 16 }}
                              transition={{ duration: 0.5, delay: 0.1 * index }}
                              className={`h-1.5 sm:h-2 mx-1 sm:mx-2 rounded-full transition-all duration-300 flex-shrink-0
                                ${isCancelled ? 'bg-red-500' :
                                  index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'}
                              `}
                              style={{ minWidth: 12, maxWidth: 32 }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {isCancelled && (
              <div className="mt-6 text-center">
                <span className="inline-block bg-red-100 text-red-700 px-6 py-3 rounded-lg font-semibold text-lg shadow-md">
                  {t('dealCancelled', 'Deal Cancelled')}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 w-full sm:w-auto">
              <button
                onClick={() => setShowCallForm(true)}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="font-medium">{t('logCall')}</span>
              </button>
              <button
                onClick={() => setShowVisitForm(true)}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="font-medium">{t('scheduleVisit')}</span>
              </button>
            </div>
            {canEdit && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <select
                  value={currentLead.status}
                  onChange={(e) => handleStatusUpdate(e.target.value as Lead['status'])}
                  disabled={isUpdatingLead}
                  className={`w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base
                    ${isUpdatingLead ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'hover:border-gray-400'}
                    ${currentLead.status === 'reservation'
                      ? 'text-blue-600 bg-blue-50 border-blue-300'
                      : currentLead.status === 'not_intersted_now'
                        ? 'text-gray-600 bg-gray-50 border-gray-300'
                        : currentLead.status === 'no_answer'
                          ? 'text-orange-500 bg-orange-50 border-orange-300'
                          : 'bg-white'}`}
                >
                  <option value={LeadStatus.FRESH_LEAD}>{t('freshLead')}</option>
                  <option value={LeadStatus.FOLLOW_UP}>{t('followUp')}</option>
                  <option value={LeadStatus.SCHEDULED_VISIT}>{t('scheduledVisit')}</option>
                  <option value={LeadStatus.OPEN_DEAL}>{t('openDeal')}</option>
                  <option value={LeadStatus.RESERVATION}>{t('reservation')}</option>
                  <option value={LeadStatus.CLOSED_DEAL}>{t('closedDeal')}</option>
                  <option value={LeadStatus.VIP}>{t('VIP (Non Stop)')}</option>

                  <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
                  <option value={LeadStatus.NO_ANSWER}>{t('noAnswer')}</option>
                  <option value={LeadStatus.NOT_INTERSTED_NOW}>{t('notInterestedNow')}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="px-2 sm:px-3 md:px-6 pt-2 sm:pt-3 md:pt-4">
          <div className="flex gap-1 sm:gap-2 md:gap-4 lg:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-none">
            {['details', 'Description', 'Ai Summry', 'calls', 'visits', 'notes', "Transfer History", "Activity"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 sm:py-3 md:py-4 px-2 sm:px-3 text-xs sm:text-sm font-medium capitalize transition-all duration-200 relative whitespace-nowrap flex-shrink-0 ${activeTab === tab
                  ? tab === 'Ai Summry'
                    ? 'text-purple-600 border-b-2 border-purple-600 transition-colors duration-300'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center">
                  {tab === 'Ai Summry' && <Bot className={`w-4 h-4 mr-1 ${activeTab !== tab && tab === 'Ai Summry' ? 'text-purple-600 animate-pulse' : ''}`} />}
                  <span className={`${activeTab !== tab && tab === 'Ai Summry' ? 'text-purple-600 animate-pulse' : ''}`}>{t(tab)}</span>
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab === 'Ai Summry' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>


        {/* Enhanced Tab Content */}
        <div className="p-2 sm:p-3 md:p-6 pt-4 sm:pt-6 md:pt-8">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Contact Information Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6 border-b pb-2">Contact Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {currentLead.nameEn || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Family Name</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {currentLead.familyName || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Phone Numbers</label>
                  {Array.isArray(currentLead.contacts) && currentLead.contacts.length > 0 ? (
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {currentLead.contacts.join(' • ')}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Not specified</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">First Connection Date</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {currentLead.firstConection ? currentLead?.firstConection : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Last Connection Date</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {currentLead?.calls?.[0]?.date ? currentLead?.calls?.[0]?.date : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Source</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {currentLead.source || 'Not specified'}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</label>
                  <p className="text-bold font-medium text-gray-900 mt-1">
                    {currentLead.gender || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Lead Details Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 border-b pb-2">Lead Details</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)} truncate max-w-full`}
                      title={lead.status}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Level</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorInterst(lead.interest)} truncate max-w-full`}
                      title={lead.interest.toString()}
                    >
                      {lead.interest}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Tier Classification</label>

                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate max-w-full ${getStatusColorTier(lead.tier)} `}
                    title={lead.tier.toString()}
                  >
                    {lead.tier}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {currentLead.budget ?
                      `EGP ${new Intl.NumberFormat('en-US').format(currentLead.budget)}` :
                      'Not specified'
                    }
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">CIL Status</label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate max-w-full bg-[#23272F1A] text-black `}
                    title={lead.cil ? "true" : "false"}
                  >
                    {lead.cil ? t("clear").toUpperCase() : t("not_clear").toUpperCase()}

                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned to</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {currentLead.owner?.name || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Description' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('leadDescription')}
                </h3>
                {/* <button
                  onClick={() => setShowDescriptionForm(true)} // تفتح فورم التعديل/الإضافة
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addDescription')}
                </button> */}
              </div>

              <div className="space-y-6">
                {lead.description && lead.description.trim() !== "" ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {lead.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {t('noDescription') || 'No description added'}
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'Ai Summry' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('aiSummry') || 'AI Tips'}
                </h3>
                <button
                  onClick={fetchAiTips}
                  disabled={loadingTips}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Bot className="w-5 h-5" />
                  {loadingTips ? 'Generating...' : t('generateAiTips') || 'Generate AI Tips'}
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {loadingTips ? (
                  <p className="text-gray-500 text-center py-6 animate-pulse">🤖 Generating tips...</p>
                ) : aiTips && (aiTips.ar_tip || aiTips.en_tip) ? (
                  <div className="rounded-2xl border border-blue-200 shadow-md overflow-hidden">
                    {/* Arabic Tip */}
                    {aiTips.ar_tip && (
                      <div className="bg-gradient-to-l from-blue-50 to-white px-4 py-3 border-b border-blue-100 text-right">
                        <p className="text-sm text-[#003aa7] leading-relaxed font-semibold">
                          <span className="mr-1">🤖 نصائح بالذكاء الاصطناعي (AR):</span>
                        </p>
                        <p dir='rtl' className="text-gray-800 mt-1 text-sm font-medium whitespace-pre-line">
                          {aiTips.ar_tip}
                        </p>
                      </div>
                    )}

                    {/* English Tip */}
                    {aiTips.en_tip && (
                      <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 text-left">
                        <p className="text-sm text-[#003aa7] leading-relaxed font-semibold">
                          <span className="mr-1">🤖 AI Tips (EN):</span>
                        </p>
                        <p className="text-gray-800 mt-1 text-sm font-medium whitespace-pre-line">
                          {aiTips.en_tip}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">
                    {t('noTips') || 'No tips available'}
                  </p>
                )}
              </div>
            </div>
          )}



          {activeTab === 'calls' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('callHistory')}</h3>
                <button
                  onClick={() => setShowCallForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCall')}
                </button>
              </div>
              <div className="space-y-6">
                {
                  calls && calls.length > 0 ?
                    calls.map((call) => (
                      <div key={call.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{call.date || 'No date'}</span>
                          <span className="text-sm text-gray-600">{call.duration || 'No duration'}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-sm text-gray-600">{t('outcome')}: </span>
                            <span className="text-sm text-gray-900">{call.outcome || 'No outcome'}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">{t('project')}: </span>
                            <div className="text-sm text-gray-900">
                              {(() => {
                                const project = projects?.find(project => project.id === call.projectId);
                                if (!project) return 'Not specified';

                                // Display both English and Arabic names if available
                                const hasBothNames = project.nameEn && project.nameAr;
                                if (hasBothNames) {
                                  return (
                                    <div className="space-y-1">
                                      <div className="font-medium">{project.nameEn}</div>
                                      <div className="text-gray-600 font-arabic">{project.nameAr}</div>
                                    </div>
                                  );
                                }
                                return project.nameEn || project.nameAr || 'Not specified';
                              })()}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{call.notes || 'No notes'}</p>
                      </div>
                    )) : <p className="text-gray-500 text-center py-4">{String(t('noCallsLogged') || 'No calls logged')}</p>}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('visitHistory')}</h3>
                <button
                  onClick={() => setShowVisitForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addVisit')}
                </button>
              </div>

              <div className="space-y-6">
                {visits && visits.length > 0 &&
                  visits.map((visit) => (
                    <div key={visit.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{visit.date || 'No date'}</span>
                        <span className="text-sm text-green-600">{visit.status || 'No status'}</span>
                      </div>


                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="text-sm text-gray-600">{t('project')}: </span>
                          <div className="text-sm text-gray-900">
                            {(() => {
                              const project = projects?.find(project => project.id === visit.project);
                              if (!project) return 'Not specified';

                              const hasBothNames = project.nameEn && project.nameAr;
                              if (hasBothNames) {
                                return (
                                  <div className="space-y-1">
                                    <div className="font-medium">{project.nameEn}</div>
                                    <div className="text-gray-600 font-arabic">{project.nameAr}</div>
                                  </div>
                                );
                              }
                              return project.nameEn || project.nameAr || 'Not specified';
                            })()}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">{t('objections')}: </span>
                          <span className="text-sm text-gray-900">{visit.objections || 'None'}</span>
                        </div>
                      </div>


                      <p className="text-sm text-gray-700 mb-2">{visit.notes || 'No notes'}</p>

                      {(user?.role === "sales_rep" ||
                        user?.role === "team_leader" ||
                        user?.role === "admin" ||
                        user?.role === "sales_admin") && (
                          <div className="flex items-center mt-2 relative">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id={`visit-done-${visit.id}`}
                                checked={visit.status === "completed" || visit.status === "Completed"}
                                disabled={
                                  loading ||
                                  ((user?.role === "sales_rep" ||
                                    user?.role === "team_leader" ||
                                    user?.role === "admin" ||
                                    user?.role === "sales_admin") &&
                                    (visit.status === "completed" || visit.status === "Completed"))
                                }
                                onChange={(e) => handelChange(e, visit)}
                                className="sr-only peer"
                              />

                              {/* الـ Track (الخلفية) */}
                              <div
                                className={`w-11 h-6 rounded-full transition-all 
                               peer-checked:bg-green-600 
                               peer-not-checked:bg-gray-300
                               ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
                              ></div>

                              {/* الـ Circle (النقطة اللي تتحرك) */}
                              <div
                                className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all 
        peer-checked:translate-x-5
      "
                              ></div>
                            </label>

                            {/* النص بجانب التوجل */}
                            <label
                              htmlFor={`visit-done-${visit.id}`}
                              className="ml-3 text-sm text-gray-700 cursor-pointer"
                            >
                              {t("Meeting Done")}
                            </label>
                          </div>

                        )}




                    </div>
                  ))}

                {visits?.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    {String(t('noVisitsLogged') || 'No visits logged')}
                  </p>
                )}
              </div>
            </div>
          )}


          {activeTab === 'notes' && (
            <div>
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">{t('notes')}</h3>
                <div className="mb-4 sm:mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={t('addNotePlaceholder')}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    {isUpdatingLead ? <div className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('addNote')}
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {notes && notes.length > 0 &&
                  notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      {editingNoteIndex === index ? (
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                          <textarea
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                              onClick={handleSaveEditNote}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              disabled={isUpdatingLead}
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={handleCancelEditNote}
                              className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                              disabled={isUpdatingLead}
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>

                          <p className="text-sm text-gray-900 mb-2 flex-1">{note}</p>
                          {
                            user?.role === "admin" || "sales_admin" ? (<div className="flex gap-2">
                              <button
                                onClick={() => handleEditNote(index)}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                disabled={isUpdatingLead}
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteNote(index)}
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                disabled={isUpdatingLead}
                              >
                                {t('delete')}
                              </button>
                            </div>) : null
                          }
                        </>
                      )}
                    </div>
                  )).reverse()}
                {notes && notes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">{String(t('noNotesAdded') || 'No notes added')}</p>
                )}
              </div>
            </div>
          )}



          {activeTab === 'Transfer History' && (
            <div>
              {/* Title */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1E3A8A] border-b pb-2 tracking-wide">
                  Lead Transfer History
                </h3>
              </div>

              {lead?.transfers && lead.transfers.length > 0 ? (
                <div className="space-y-6 relative pl-6">
                  {/* Vertical line for timeline */}
                  <div className="absolute top-0 left-2 w-0.5 h-full bg-blue-200"></div>

                  {(lead.transfers as Transfer[])
                    .slice()
                    .reverse()
                    .map((transfer) => {
                      const getInitials = (name?: string) =>
                        name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase();

                      return (
                        <div
                          key={transfer.id}
                          className="relative flex items-start gap-4 bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute -left-[22px] top-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md"></div>

                          {/* Main content */}
                          <div className="flex-1">
                            {/* Agents */}
                            <div className="flex items-center gap-2">
                              {/* From Agent */}
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow">
                                  {getInitials(transfer.fromAgent?.name)}
                                </div>
                                <span className="text-sm font-semibold text-gray-800">
                                  {transfer.fromAgent?.name}
                                </span>
                              </div>

                              <span className="text-gray-400 text-sm">→</span>

                              {/* To Agent */}
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow">
                                  {getInitials(transfer.toAgent?.name)}
                                </div>
                                <span className="text-sm font-semibold text-gray-800">
                                  {transfer.toAgent?.name}
                                </span>
                              </div>
                            </div>

                            {/* Notes */}
                            {transfer.notes && (
                              <p className="text-sm text-gray-600 mt-3 border-l-2 border-blue-300 pl-3 italic leading-relaxed">
                                {transfer.notes}
                              </p>
                            )}
                          </div>

                          {/* Date + Type */}
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-400">
                              {transfer.createdAt}
                            </span>
                            <span className="text-xs mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full shadow-sm font-medium">
                              {transfer.transferType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No transfer history available
                </p>
              )}
            </div>
          )}



          {activeTab === "Activity" && (
            <div>
              {/* Title */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 tracking-wide">
                  Activity Timeline
                </h3>
              </div>

              {/* Timeline */}
              <div className="space-y-8 relative pl-10">
                {/* Vertical line */}
                <div className="absolute top-0 left-4 w-0.5 h-full bg-gray-200"></div>

                {getActivities(lead).map((activity: any) => (
                  <div key={activity.id} className="relative flex items-start">
                    {/* Icon */}
                    <div
                      className={`absolute -left-1 top-1 w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}
                    >
                      {activity.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pl-12">
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.description}
                      </p>

                      {/* --- START: NEW CODE --- */}
                      {/* User and Date Info */}
                      <div className="text-xs text-gray-400 mt-1 flex items-center">
                        <span>
                          {new Date(activity.date).toLocaleDateString('en-CA')} {/* 'en-CA' format is YYYY-MM-DD */}
                        </span>
                        {/* عرض اسم المستخدم فقط إذا كان موجودًا */}
                        {activity.userName && (
                          <>
                            <span className="mx-1.5">&bull;</span>
                            <span>by</span>
                            <span className="font-medium text-gray-500 ml-1">
                              {activity.userName}
                            </span>
                          </>
                        )}
                      </div>
                      {/* --- END: NEW CODE --- */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}




        </div>

        {/* Call Form Modal */}
        {showCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('logCall')}</h3>
              <form onSubmit={handleAddCall} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={callForm.date}
                    onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('outcome')}</label>
                  <select
                    value={callForm.outcome}
                    onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    required
                  >
                    <option value="">{t('selectOutcome')}</option>
                    <option value="Interested">{t('interested')}</option>
                    <option value="Not Interested">{t('notInterested')}</option>
                    <option value="Follow Up Required">{t('followUpRequired')}</option>
                    <option value="Meeting Scheduled">{t('meetingScheduled')}</option>
                    <option value="No Answer">{t('No Answer')}</option>
                  </select>
                </div>

                {/* يظهر فقط لو outcome = "Follow Up Required" */}
                {callForm.outcome === 'Follow Up Required' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Follow Up Date')}</label>
                      <input
                        type="date"
                        value={callForm.followUpDate || ''}
                        onChange={(e) => setCallForm({ ...callForm, followUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Follow Up Time Reminder')}</label>
                      <input
                        type="time"
                        value={callForm.followUpTime || ''}
                        onChange={(e) => setCallForm({ ...callForm, followUpTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('duration')}</label>
                  <input
                    type="text"
                    value={callForm.duration}
                    onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                    placeholder={t('durationPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                  <select
                    value={callForm.project}
                    onChange={(e) => setCallForm({ ...callForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.nameEn && project.nameAr
                          ? `${project.nameEn} / ${project.nameAr}`
                          : project.nameEn || project.nameAr || 'Unnamed Project'
                        }
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesField')}</label>
                  <textarea
                    value={callForm.notes}
                    onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCallForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 order-2 sm:order-1"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
                  >
                    {isCreatingCall ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('logCallButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* {showDescriptionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('addDescription')}</h3>
              <form onSubmit={handleSaveDescription} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('leadDescription')}</label>
                  <textarea
                    value={descriptionForm.text}
                    onChange={(e) => setDescriptionForm({ ...descriptionForm, text: e.target.value })}
                    placeholder={t('enterLeadDescription')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDescriptionForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 order-2 sm:order-1"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
                  >
                    {isSavingDescription ? (
                      <div
                        className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"
                        role="status"
                      ></div>
                    ) : (
                      t('saveDescription')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )} */}

        {/* Visit Form Modal */}
        {showVisitForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('logVisit')}</h3>
              <form onSubmit={handleAddVisit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={visitForm.date}
                    onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                  <select
                    value={visitForm.project}
                    onChange={(e) => setVisitForm({ ...visitForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.nameEn}>
                        {project.nameEn && project.nameAr
                          ? `${project.nameEn} / ${project.nameAr}`
                          : project.nameEn || project.nameAr || 'Unnamed Project'
                        }
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('objections')}</label>
                  <input
                    type="text"
                    value={visitForm.objections}
                    onChange={(e) => setVisitForm({ ...visitForm, objections: e.target.value })}
                    placeholder={t('objectionsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>






                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesField')}</label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVisitForm(false)}
                    className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 order-2 sm:order-1 text-sm sm:text-base"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 order-1 sm:order-2 text-sm sm:text-base"
                  >
                    {isCreatingVisit ? <div className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('logVisitButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {showPhoneForm && (
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder={t('enterPhoneNumber')}
              className="border px-3 py-1 rounded-lg w-full"
            />
            <button
              onClick={() => {
                if (newPhone.trim()) {

                  setCurrentLead({
                    ...currentLead,
                    contacts: [...(currentLead.contacts || []), newPhone],
                  });
                  setNewPhone("");
                  setShowPhoneForm(false);
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg"
            >
              {t('save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadModal;