import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, message, Spin, Input, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { all_routes } from '../../router/all_routes';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import adminService from '../../../services/api/admin.service';
import { getFileUrl } from '../../../environment';
import { CourseCategory } from '../../../services/api/types';

const { TextArea } = Input;

const AdminCategories = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CourseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', displayOrder: categories.length });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CourseCategory) => {
    setIsEditMode(true);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder || 0,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      message.error('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      let category: CourseCategory;

      if (isEditMode && editingCategory) {
        category = await adminService.updateCategory(editingCategory.id, formData);
        message.success('Category updated successfully');
      } else {
        category = await adminService.createCategory(formData);
        message.success('Category created successfully');
      }

      if (imageFile && category && category.id) {
        try {
          await adminService.uploadCategoryImage(category.id, imageFile);
          message.success('Image uploaded successfully');
        } catch (imgError) {
          console.error('Image upload error:', imgError);
          message.warning('Category saved but image upload failed');
        }
      }

      setIsModalOpen(false);
      setImageFile(null);
      setFormData({ name: '', description: '', displayOrder: 0 });
      await fetchCategories();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          (isEditMode ? 'Failed to update category' : 'Failed to create category');
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange: UploadProps['onChange'] = (info) => {
    if (info.file.originFileObj) {
      setImageFile(info.file.originFileObj);
    }
  };

  const openDeleteModal = (category: CourseCategory) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsSubmitting(true);
      await adminService.deleteCategory(categoryToDelete.id);
      message.success('Category deleted successfully');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category. It may have associated courses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LuxuryDashboardLayout>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>Category Management</h5>
          <p style={{ color: 'var(--lx-text-muted)', margin: 0, fontSize: 13 }}>Create and manage course categories</p>
        </div>
        <button className="lx-btn lx-btn-gold" onClick={openCreateModal}>
          <i className="isax isax-add" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="lx-stat-card">
            <div className="stat-icon gold">
              <i className="isax isax-folder-2" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Categories</p>
              <h3 className="stat-value">{categories.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="lx-stat-card">
            <div className="stat-icon sage">
              <i className="isax isax-book" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Courses</p>
              <h3 className="stat-value">
                {categories.reduce((sum, cat) => sum + (cat.coursesCount || 0), 0)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="lx-stat-card">
            <div className="stat-icon rose">
              <i className="isax isax-image" />
            </div>
            <div className="stat-info">
              <p className="stat-label">With Images</p>
              <h3 className="stat-value">
                {categories.filter(cat => cat.imageUrl).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spin size="large" />
        </div>
      ) : categories.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-folder-2" /></div>
              <h6>No Categories Yet</h6>
              <p>Create your first category to organize your courses.</p>
              <button className="lx-btn lx-btn-gold" onClick={openCreateModal}>
                <i className="isax isax-add" />
                Create Category
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {categories.map((category) => (
            <div key={category.id} className="col-md-6 col-lg-4">
              <div className="lx-card h-100" style={{ overflow: 'hidden' }}>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: 150,
                    overflow: 'hidden',
                    background: 'rgba(107, 29, 42, 0.03)',
                  }}
                >
                  {category.imageUrl ? (
                    <img
                      src={getFileUrl(category.imageUrl) ?? category.imageUrl}
                      alt={category.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="isax isax-folder-2" style={{ fontSize: 48, color: 'var(--lx-gold)' }} />
                  )}
                </div>
                <div className="lx-card-body">
                  <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 6 }}>
                    {category.name}
                  </h5>
                  <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', minHeight: 40, marginBottom: 12, lineHeight: 1.6 }}>
                    {category.description || 'No description'}
                  </p>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="lx-badge badge-info">
                      <i className="isax isax-book me-1" />
                      {category.coursesCount || 0} Courses
                    </span>
                    <div className="d-flex gap-2">
                      <button
                        className="lx-btn lx-btn-outline lx-btn-sm"
                        onClick={() => openEditModal(category)}
                        title="Edit"
                      >
                        <i className="isax isax-edit-2" />
                      </button>
                      <button
                        className="lx-btn lx-btn-sm"
                        style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                        onClick={() => openDeleteModal(category)}
                        title="Delete"
                      >
                        <i className="isax isax-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? 'Edit Category' : 'Create New Category'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
            Category Name <span style={{ color: '#8B2335' }}>*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
            Description
          </label>
          <TextArea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter category description"
            rows={3}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
            Display Order
          </label>
          <Input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
            placeholder="Enter display order"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
            Category Image
          </label>
          <Upload
            beforeUpload={() => false}
            onChange={handleImageChange}
            maxCount={1}
            accept="image/*"
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
          {isEditMode && editingCategory?.imageUrl && !imageFile && (
            <div style={{ marginTop: 8 }}>
              <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginBottom: 4 }}>Current image:</p>
              <img
                src={getFileUrl(editingCategory.imageUrl) ?? editingCategory.imageUrl}
                alt="Current"
                style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 'var(--lx-radius)' }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Category"
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteModalOpen(false);
              setCategoryToDelete(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={isSubmitting}
            onClick={handleDelete}
          >
            Delete
          </Button>,
        ]}
      >
        <p style={{ color: 'var(--lx-text)' }}>
          Are you sure you want to delete the category{' '}
          <strong>{categoryToDelete?.name}</strong>?
        </p>
        {categoryToDelete && (categoryToDelete.coursesCount || 0) > 0 && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(139, 35, 53, 0.06)',
              border: '1px solid rgba(139, 35, 53, 0.12)',
              color: '#8B2335',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="isax isax-warning-2" />
            This category has {categoryToDelete.coursesCount} courses. You cannot delete it
            until all courses are moved to a different category.
          </div>
        )}
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default AdminCategories;
