import { api } from '@/lib/api';

export interface AdminUserUpdatePayload {
  role?: 'user' | 'admin';
  accountStatus?: 'active' | 'suspended' | 'blocked';
  kycStatus?: 'pending' | 'in_review' | 'approved' | 'rejected';
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
}

export const adminService = {
  updateUser: async (uuid: string, payload: AdminUserUpdatePayload) => {
    const res = await api.patch(`/users/admin/${uuid}`, payload);
    return res.data?.data;
  },

  deleteUser: async (uuid: string) => {
    const res = await api.delete(`/users/admin/${uuid}`);
    return res.data;
  },
};
