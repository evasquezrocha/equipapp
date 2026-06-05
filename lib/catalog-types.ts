export type CompanyCrudRow = {
  id: number;
  name: string;
  taxId: string;
  domain: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  phone: string | null;
  active: boolean;
  users: number;
  equipment: number;
};

export type CompanyInput = {
  name: string;
  taxId: string;
  domain?: string;
  contactPerson?: string;
  contactEmail?: string;
  phone?: string;
};

export type CollaboratorCrudRow = {
  id: number;
  companyId: number;
  companyName: string;
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  cargo: string | null;
  phone: string | null;
  active: boolean;
  equipmentCount: number;
};

export type CollaboratorInput = {
  companyId: number;
  code: string;
  firstName: string;
  lastName: string;
  email?: string;
  cargo?: string;
  phone?: string;
};

export type EquipmentCrudRow = {
  id: number;
  companyId: number;
  companyName: string;
  typeName: string;
  imageCount: number;
  code: string;
  serial: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  state: string;
  condition: string;
  collaboratorId: number | null;
  collaboratorName: string | null;
  purchaseDate: string | null;
  estimatedCost: number | null;
  notes: string | null;
};

export type EquipmentInput = {
  companyId: number;
  typeName: string;
  code: string;
  serial?: string;
  brand?: string;
  model?: string;
  color?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  state?: string;
  condition?: string;
  collaboratorId?: number | null;
  purchaseDate?: string;
  estimatedCost?: number | null;
  notes?: string;
};

export type CompanySelectRow = {
  id: number;
  name: string;
};

export type CollaboratorSelectRow = {
  id: number;
  companyId: number;
  name: string;
};
