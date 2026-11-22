import { api, jsonBody } from './client'
import type { BranchView, OrganizationView, OrgUserView, PermissionView, RoleView } from './types'

export const organizationApi = {
  current: () => api<OrganizationView>('/api/v1/organization/current'),
  branches: () => api<BranchView[]>('/api/v1/organization/branches'),
  createBranch: (body: { code: string; name: string; phone?: string | null; address?: string | null }) =>
    api<BranchView>('/api/v1/organization/branches', { method: 'POST', body: jsonBody(body) }),
  updateBranch: (id: string, body: { name: string; phone?: string | null; address?: string | null; status: string }) =>
    api<BranchView>(`/api/v1/organization/branches/${id}`, { method: 'PATCH', body: jsonBody(body) }),
  permissions: () => api<PermissionView[]>('/api/v1/organization/permissions'),
  roles: () => api<RoleView[]>('/api/v1/organization/roles'),
  createRole: (body: { code: string; name: string; description?: string | null; permissions: string[] }) =>
    api<RoleView>('/api/v1/organization/roles', { method: 'POST', body: jsonBody(body) }),
  updateRole: (id: string, body: { name: string; description?: string | null; permissions: string[]; status: string }) =>
    api<RoleView>(`/api/v1/organization/roles/${id}`, { method: 'PATCH', body: jsonBody(body) }),
  users: () => api<OrgUserView[]>('/api/v1/organization/users'),
  createUser: (body: {
    email: string
    initialPassword?: string | null
    firstName: string
    lastName: string
    nationalId?: string | null
    mobile?: string | null
    roleId: string
    scopeType: 'TENANT' | 'BRANCH'
    scopeId?: string | null
  }) => api<OrgUserView>('/api/v1/organization/users', { method: 'POST', body: jsonBody(body) }),
  changeUserStatus: (id: string, body: { membershipStatus: string; accountStatus: string }) =>
    api<OrgUserView>(`/api/v1/organization/users/${id}/status`, { method: 'PATCH', body: jsonBody(body) }),
  addGrant: (id: string, body: { roleId: string; scopeType: 'TENANT' | 'BRANCH'; scopeId?: string | null }) =>
    api<OrgUserView>(`/api/v1/organization/users/${id}/grants`, { method: 'POST', body: jsonBody(body) }),
}
