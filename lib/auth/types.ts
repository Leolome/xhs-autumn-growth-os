import type { BaseRecord, Campus } from "@/lib/types";

export type UserRole = "admin" | "operator" | "campus_manager" | "teacher" | "viewer";

export interface UserContext {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  campus: Campus | null;
  ownerAccountIds: string[];
  isMock: boolean;
}

export interface UserProfile extends BaseRecord {
  email: string;
  displayName: string;
  role: UserRole;
  campus: Campus | null;
  ownerAccountIds: string[];
  isActive: boolean;
}

export interface ManagedUserInput {
  id?: string;
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  campus: Campus | null;
  ownerAccountIds: string[];
  isActive: boolean;
}

export const roleLabels: Record<UserRole, string> = {
  admin: "系统管理员",
  operator: "运营负责人",
  campus_manager: "校区负责人",
  teacher: "老师",
  viewer: "只读查看",
};
