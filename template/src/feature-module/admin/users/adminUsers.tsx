import React, { useState, useEffect } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import {
  Spin,
  message,
  Modal,
  Input,
  Select,
  Pagination,
  Popconfirm,
} from 'antd';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchUsers, banUser, unbanUser, deleteUser } from '../../../core/redux/adminSlice';
import adminService from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';
import { getFileUrl } from '../../../environment';

const { Search } = Input;

// ── Shared glass modal shell (matches InstructorAssignment design) ────────────
const GlassModal: React.FC<{ children: React.ReactNode; onClose: () => void; maxWidth?: number }> = ({
  children, onClose, maxWidth = 480,
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(44, 24, 16, 0.40)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{
      width: '100%', maxWidth,
      background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(32px)',
      borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107,29,42,0.10)',
      boxShadow: '0 24px 48px rgba(44,24,16,0.15)',
    }}>
      {children}
    </div>
  </div>
);

interface User {
  id: number | string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | string;
  isBanned: boolean;
  isEmailVerified: boolean;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, usersPagination, isLoadingUsers, error } = useAppSelector(
    (state: any) => state.admin
  ) as {
    users: User[];
    usersPagination: { totalPages: number; totalElements: number };
    isLoadingUsers: boolean;
    error: string | null;
  };

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [banModalVisible, setBanModalVisible] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string>('');

  // Create user state
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', role: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, size: 20, search: searchTerm || undefined }));
  }, [dispatch, currentPage, searchTerm]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => setCurrentPage(page - 1);

  const handleBanUser = (userId: string) => {
    setSelectedUserId(userId);
    setBanModalVisible(true);
  };

  const confirmBan = async () => {
    if (selectedUserId) {
      try {
        await dispatch(banUser({ userId: selectedUserId, reason: banReason })).unwrap();
        message.success('User banned successfully');
        setBanModalVisible(false);
        setBanReason('');
        setSelectedUserId(null);
      } catch {
        message.error('Failed to ban user');
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await dispatch(unbanUser(userId)).unwrap();
      message.success('User unbanned successfully');
    } catch {
      message.error('Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      message.success('User deleted successfully');
    } catch {
      message.error('Failed to delete user');
    }
  };

  const openCreateModal = () => {
    setCreateForm({ fullName: '', email: '', role: 'STUDENT' });
    setCreateError(null);
    setCreateSuccess(false);
    setCreateModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await adminService.createUser(createForm);
      setCreateSuccess(true);
      dispatch(fetchUsers({ page: currentPage, size: 20, search: searchTerm || undefined }));
    } catch (err) {
      setCreateError(extractApiError(err, 'Failed to create user'));
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setCreateModal(false);
    setCreateSuccess(false);
    setCreateError(null);
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      ADMIN:      { cls: 'badge-danger',  label: 'Admin' },
      INSTRUCTOR: { cls: 'badge-success', label: 'Instructor' },
      STUDENT:    { cls: 'badge-warning', label: 'Student' },
    };
    const b = map[role] || { cls: 'badge-info', label: role };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const getStatusBadge = (isBanned: boolean, isEmailVerified: boolean) => {
    if (isBanned) return <span className="lx-badge badge-danger">Banned</span>;
    if (!isEmailVerified) return <span className="lx-badge badge-warning">Unverified</span>;
    return <span className="lx-badge badge-success">Active</span>;
  };

  const filteredUsers: User[] = roleFilter
    ? users.filter((user: User) => user.role === roleFilter)
    : users;

  const studentCount = users.filter((u: User) => u.role === 'STUDENT').length;
  const instructorCount = users.filter((u: User) => u.role === 'INSTRUCTOR').length;
  const adminCount = users.filter((u: User) => u.role === 'ADMIN').length;

  return (
    <LuxuryDashboardLayout>
      {/* ── Stats Cards ── */}
      <div className="row g-4 mb-4">
        {[
          { label: 'Students',    value: studentCount,    icon: 'isax isax-user',        color: 'gold'  },
          { label: 'Instructors', value: instructorCount, icon: 'isax isax-teacher',     color: 'sage'  },
          { label: 'Admins',      value: adminCount,      icon: 'isax isax-shield-tick', color: 'rose'  },
        ].map((s, i) => (
          <div key={i} className="col-md-4">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value">{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Glass Users Table ── */}
      <div className="lx-card">
        <div className="lx-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h6>All Users</h6>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Search
              placeholder="Search users..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Filter by role"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setRoleFilter(value || '')}
              options={[
                { value: 'STUDENT', label: 'Students' },
                { value: 'INSTRUCTOR', label: 'Instructors' },
                { value: 'ADMIN', label: 'Admins' },
              ]}
            />
            <button
              type="button"
              className="lx-btn lx-btn-gold"
              onClick={openCreateModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className="isax isax-user-add" />
              Create User
            </button>
          </div>
        </div>

        <div className="lx-card-body" style={{ padding: 0 }}>
          {isLoadingUsers ? (
            <div className="d-flex justify-content-center py-5">
              <Spin size="large" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-people" /></div>
              <h6>No users found</h6>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Subscription</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: User) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : '/assets/img/user/user-01.jpg'}
                            alt=""
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '2px solid rgba(107, 29, 42, 0.08)',
                            }}
                          />
                          <div>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lx-text)', margin: '0 0 1px' }}>
                              {user.fullName}
                            </p>
                            <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.isBanned, user.isEmailVerified)}</td>
                      <td>
                        {user.subscriptionStatus === 'ACTIVE' ? (
                          <span
                            className="lx-badge"
                            style={{
                              background: 'var(--lx-gold-pale)',
                              color: 'var(--lx-gold)',
                            }}
                          >
                            <i className="isax isax-crown-1" style={{ fontSize: 11, marginRight: 3 }} />
                            Premium
                          </span>
                        ) : (
                          <span className="lx-badge badge-info">Free</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, color: 'var(--lx-text-muted)' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          {user.isBanned ? (
                            <button
                              className="lx-btn lx-btn-outline lx-btn-sm"
                              style={{ color: 'var(--lx-green)', borderColor: 'rgba(45, 95, 63, 0.20)' }}
                              onClick={() => handleUnbanUser(String(user.id))}
                              title="Unban User"
                            >
                              <i className="isax isax-shield-tick" />
                            </button>
                          ) : (
                            <button
                              className="lx-btn lx-btn-outline lx-btn-sm"
                              style={{ color: 'var(--lx-gold)', borderColor: 'rgba(197, 151, 62, 0.20)' }}
                              onClick={() => handleBanUser(String(user.id))}
                              title="Ban User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <i className="isax isax-shield-cross" />
                            </button>
                          )}
                          <Popconfirm
                            title="Delete User"
                            description="Are you sure? This action cannot be undone."
                            onConfirm={() => handleDeleteUser(String(user.id))}
                            okText="Yes, Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              className="lx-btn lx-btn-sm"
                              style={{
                                background: 'rgba(139, 35, 53, 0.08)',
                                color: '#8B2335',
                                border: '1.5px solid rgba(139, 35, 53, 0.15)',
                              }}
                              title="Delete User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <i className="isax isax-trash" />
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {usersPagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '16px 24px',
              borderTop: 'var(--lx-glass-border)',
              background: 'var(--lx-glass-light)',
            }}
          >
            <Pagination
              current={currentPage + 1}
              total={usersPagination.totalElements}
              pageSize={20}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* ── Create User Modal ── */}
      {createModal && (
        <GlassModal onClose={closeCreateModal}>
          {/* Header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid rgba(107,29,42,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
              Create New User
            </h5>
            <button
              type="button"
              onClick={closeCreateModal}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)', lineHeight: 1 }}
            >
              <i className="isax isax-close-circle" />
            </button>
          </div>

          {/* Success state */}
          {createSuccess ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(22,163,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-tick-circle" style={{ fontSize: 28, color: '#16a34a' }} />
              </div>
              <h5 style={{ fontWeight: 700, fontSize: 17, color: 'var(--lx-text)', marginBottom: 8 }}>
                User Created!
              </h5>
              <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, marginBottom: 28 }}>
                The account was created and login credentials were sent to <strong>{createForm.email}</strong>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button type="button" className="lx-btn lx-btn-gold" onClick={() => {
                  setCreateSuccess(false);
                  setCreateForm({ fullName: '', email: '', role: 'STUDENT' });
                  setCreateError(null);
                }}>
                  Create Another
                </button>
                <button type="button" className="lx-btn lx-btn-outline" onClick={closeCreateModal}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleCreateUser}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

                {createError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(139,35,53,0.06)', border: '1px solid rgba(139,35,53,0.12)',
                    color: '#8B2335', fontSize: 13,
                  }}>
                    <i className="isax isax-warning-2" style={{ marginRight: 6 }} />{createError}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    Full Name <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Sarah Johnson"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid rgba(107,29,42,0.12)', borderRadius: 'var(--lx-radius-sm)',
                      fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)', color: 'var(--lx-text)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    Email Address <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. sarah@example.com"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid rgba(107,29,42,0.12)', borderRadius: 'var(--lx-radius-sm)',
                      fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)', color: 'var(--lx-text)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    Role <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as any }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid rgba(107,29,42,0.12)', borderRadius: 'var(--lx-radius-sm)',
                      fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)', color: 'var(--lx-text)',
                      cursor: 'pointer', appearance: 'auto',
                    }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Info hint */}
                <div style={{
                  display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(107,29,42,0.04)', border: '1px solid rgba(107,29,42,0.08)',
                }}>
                  <i className="isax isax-info-circle" style={{ color: 'var(--lx-primary)', fontSize: 15, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--lx-text-muted)', lineHeight: 1.5 }}>
                    A secure password will be auto-generated and sent to the user's email address along with their login credentials.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid rgba(107,29,42,0.08)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button type="button" className="lx-btn lx-btn-outline" onClick={closeCreateModal} disabled={creating}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lx-btn lx-btn-gold"
                  disabled={creating || !createForm.fullName.trim() || !createForm.email.trim()}
                >
                  {creating ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Creating…
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className="isax isax-user-add" />
                      Create &amp; Send Email
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </GlassModal>
      )}

      {/* ── Ban User Modal ── */}
      <Modal
        title="Ban User"
        open={banModalVisible}
        onOk={confirmBan}
        onCancel={() => {
          setBanModalVisible(false);
          setBanReason('');
          setSelectedUserId(null);
        }}
        okText="Ban User"
        okButtonProps={{ danger: true }}
      >
        <p style={{ color: 'var(--lx-text-mid)', marginBottom: 16 }}>
          Are you sure you want to ban this user?
        </p>
        <Input.TextArea
          placeholder="Reason for banning (optional)"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default AdminUsers;
