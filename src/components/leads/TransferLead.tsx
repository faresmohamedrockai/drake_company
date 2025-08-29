import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "../../contexts/AuthContext";
import { Lead, Interest, Tier } from "../../types";
import axiosInterceptor from "../../../axiosInterceptor/axiosInterceptor";
import { toast } from 'react-toastify';
interface TransferLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (data: {
    leadId: string;
    fromAgentId?: string;
    toAgentId: string;
    transferType: string;
    notes?: string;
  }) => void;
  lead: Lead | null;
}









export default function TransferLeadModal({
  isOpen,
  onClose,
  // onTransfer,
  lead,
}: TransferLeadModalProps) {
  const getUsers = async () => {
    const response = await axiosInterceptor.get("/auth/users");
    return response.data as UserType[];
  };

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ["users"],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getUsers(),
  });

  const [agent, setAgent] = useState("");
  const [type, setType] = useState("with-history");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 🛑 التحقق الأولي
    if (!lead?.id) {
      toast.error("Lead is required");
      return;
    }
    if (!agent) {
      toast.error("Please select an agent");
      return;
    }
    if (!type) {
      toast.error("Please select a transfer type");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        leadId: lead.id,
        fromAgentId: lead.owner?.id ?? null, // من عند مين
        toAgentId: agent, // رايح لمين
        transferType: type, // نوع النقل
        notes: notes?.trim() || undefined, // ملاحظات إن وجدت
      };

      const res = await axiosInterceptor.post("/transfer", payload);

      if (res.data?.success) {
        toast.success("✅ Lead transferred successfully!");
        // onTransfer(payload as any); // عشان تحدث الـ state في الـ UI
        onClose();
        console.log("true")
      } else {
        toast.error(res.data?.message || "Transfer failed, please try again.");
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(
        error?.response?.data?.message ||
        "❌ Failed to transfer lead. Please try again later."
      );
      console.log("false")
    } finally {
      setLoading(false);
    }
  };



  const getStatusColorInterst = useMemo(
    () => (status: string) => {
      switch (status) {
        case Interest.UNDER_DECISION:
          return "bg-blue-100 text-blue-800";
        case Interest.HOT:
          return "bg-yellow-100 text-yellow-800";
        case Interest.WARM:
          return "bg-purple-100 text-purple-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    },
    []
  );

  const getStatusColorTier = useMemo(
    () => (status: string) => {
      switch (status) {
        case Tier.BRONZE:
          return "bg-blue-100 text-blue-800";
        case Tier.GOLD:
          return "bg-yellow-100 text-yellow-800";
        case Tier.PLATINUM:
          return "bg-purple-100 text-purple-800";
        case Tier.SILVER:
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    },
    []
  );

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold mb-5">Transfer Lead</h2>

        <hr />
        <br />

        {/* Lead Info + Current Assignment */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Lead Info Card */}
          <div className="bg-transparent border rounded-xl p-4 flex justify-between items-start h-fit ">
            <p className="font-medium text-gray-900">
              {lead.nameEn?.toLocaleUpperCase() ??
                lead.nameAr?.toLocaleUpperCase() ??
                ""}

              <p className="text-sm text-gray-600">{lead.contact}</p>
            </p>

            <div className="flex gap-2 mt-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate max-w-full ${getStatusColorTier(
                  lead.tier
                )} `}
              >
                {lead.tier}
              </span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorInterst(
                  lead.interest
                )} truncate max-w-full`}
              >
                {lead.interest}
              </span>
            </div>
          </div>

          {/* Assigned To Card */}
          <div className="bg-transparent border rounded-xl p-4 h-fit">
            <p className="text-xs text-gray-500 mb-1">Currently assigned to:</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                {lead.owner?.name?.[0] || "?"}
              </div>
              <p className="font-medium text-gray-900">{lead.owner?.name} ({lead.owner?.role})</p>
            </div>
          </div>
        </div>

        {/* Transfer To Agent */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transfer to Agent *
          </label>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="w-full border-none rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-300"
            required
          >
            <option value="">Select an agent</option>
            {isLoadingUsers ? (
              <option disabled>Loading users...</option>
            ) : (
              users
                ?.filter((user) => user.id !== lead?.owner?.id) // 👈 استبعاد المالك الحالي
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) ) ({user.role})
                  </option>
                ))
            )}
          </select>
        </div>


        {/* Transfer Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transfer Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border-none rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-300"
            required
          >
            <option value="with-history">Transfer with History</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Lead will appear as new to the receiving agent
          </p>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transfer Notes
          </label>
          <textarea
            placeholder="Add any important notes about this transfer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm h-20 focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
           type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Transferring..." : "→ Transfer Lead"}
          </button>

        </div>
      </div>
    </div>
  );
}
