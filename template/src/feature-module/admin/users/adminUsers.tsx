import React, { useState, useEffect } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
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

const { Search } = Input;

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [banReason, setBanReason] = useState<string>('');

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

  const handleBanUser = (userId: number) => {
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

  const handleUnbanUser = async (userId: number) => {
    try {
      await dispatch(unbanUser(userId)).unwrap();
      message.success('User unbanned successfully');
    } catch {
      message.error('Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      message.success('User deleted successfully');
    } catch {
      message.error('Failed to delete user');
    }
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
          <div className="d-flex flex-wrap gap-2">
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
                            src={user.avatarUrl || '/assets/img/user/user-01.jpg'}
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
                              onClick={() => handleUnbanUser(Number(user.id))}
                              title="Unban User"
                            >
                              <i className="isax isax-shield-tick" />
                            </button>
                          ) : (
                            <button
                              className="lx-btn lx-btn-outline lx-btn-sm"
                              style={{ color: 'var(--lx-gold)', borderColor: 'rgba(197, 151, 62, 0.20)' }}
                              onClick={() => handleBanUser(Number(user.id))}
                              title="Ban User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <i className="isax isax-shield-cross" />
                            </button>
                          )}
                          <Popconfirm
                            title="Delete User"
                            description="Are you sure? This action cannot be undone."
                            onConfirm={() => handleDeleteUser(Number(user.id))}
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
