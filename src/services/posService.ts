import api from '@/lib/api';

export interface PosTerminal {
  id: string;
  name: string;
  branchId: string;
  ipAddress: string;
  port: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    addres?: string;
    companyId: string;
  };
}

export interface CreatePosDto {
  name: string;
  branchId: string;
  ipAddress: string;
  port?: string;
}

export interface UpdatePosDto {
  name?: string;
  ipAddress?: string;
  port?: string;
}

export const posService = {
  getAll: async (): Promise<PosTerminal[]> => {
    const res = await api.get('/pos-terminal');
    return res.data;
  },

  getOne: async (id: string): Promise<PosTerminal> => {
    const res = await api.get(`/pos-terminal/${id}`);
    return res.data;
  },

  create: async (data: CreatePosDto): Promise<PosTerminal> => {
    const res = await api.post('/pos-terminal', data);
    return res.data;
  },

  update: async (id: string, data: UpdatePosDto): Promise<PosTerminal> => {
    const res = await api.patch(`/pos-terminal/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string): Promise<PosTerminal> => {
    const res = await api.patch(`/pos-terminal/status/${id}`);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/pos-terminal/${id}`);
  },
};
