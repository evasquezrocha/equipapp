export type AuthSession = {
  userId: number;
  name: string;
  email: string;
  roleCode: string;
  roleName: string;
  isAdmin: boolean;
  companyIds: number[];
  companyNames: string[];
  expiresAt: number;
};

