import React, { useState, useEffect, useRef } from "react"
import LuxuryDashboardLayout from "../../../components/LuxuryDashboardLayout"
import { all_routes } from "../../router/all_routes"
import { Link } from "react-router-dom"
import SettingsLinks from "./settingsLinks/settingsLinks"
import ImageWithBasePath from "../../../core/common/imageWithBasePath"
import SettingsModal from "./settingsModal/settingsModal"
import { useAppSelector, useAppDispatch } from "../../../core/redux/hooks"
import { setUser } from "../../../core/redux/authSlice"
import profileService from "../../../services/api/profile.service"
import { extractApiError } from "../../../services/api/error.utils"
import { getFileUrl } from "../../../environment"
import { App } from "antd"

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--lx-text-mid)',
  marginBottom: 6,
}

const StudentSettings = () => {
  const route = all_routes
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { message } = App.useApp()

  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bio: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        bio: user.bio || "",
      })
    }
  }, [user])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      message.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error("Image size should be less than 5MB")
      return
    }

    try {
      setAvatarUploading(true)
      const avatarUrl = await profileService.uploadAvatar(file)
      if (user) {
        dispatch(setUser({ ...user, avatarUrl }))
      }
      message.success("Profile photo updated successfully")
    } catch (error) {
      message.error(extractApiError(error, "Failed to upload profile photo. Please try again."))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      message.error("Full name is required")
      return
    }

    if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      message.error("Full name must be between 2 and 100 characters")
      return
    }

    try {
      setSaving(true)
      const updatedUser = await profileService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
      })
      dispatch(setUser(updatedUser))
      message.success("Profile updated successfully")
    } catch (error) {
      message.error(extractApiError(error, "Failed to update profile. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <LuxuryDashboardLayout>
      <div style={{ marginBottom: 20 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Settings</h5>
      </div>

      <SettingsLinks />

      {/* Profile Form Card */}
      <div className="lx-card" style={{ marginBottom: 24 }}>
        <div className="lx-card-body">
          <form onSubmit={handleSubmit}>
            {/* Avatar Upload */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
              padding: 20, borderRadius: 'var(--lx-radius)',
              background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)',
            }}>
              <Link
                to={route.studentProfile}
                style={{
                  width: 88, height: 88, borderRadius: '50%', flexShrink: 0,
                  border: '3px solid rgba(107, 29, 42, 0.1)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.6)',
                }}
              >
                {avatarUploading ? (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                ) : user?.avatarUrl ? (
                  <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageWithBasePath src="assets/img/user/user-02.jpg" alt="Img" className="img-fluid" />
                )}
              </Link>
              <div>
                <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                  <Link to={route.studentProfile} style={{ color: 'inherit', textDecoration: 'none' }}>Profile Photo</Link>
                </h6>
                <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: '0 0 10px' }}>
                  PNG or JPG no bigger than 800px width and height
                </p>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="lx-btn lx-btn-outline lx-btn-sm"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div style={{ marginBottom: 24 }}>
              <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>Personal Details</h5>
              <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>Edit your personal information</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>
                  Full Name <span style={{ color: '#8B2335' }}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  style={inputStyle}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={{ ...inputStyle, background: 'rgba(107, 29, 42, 0.03)', cursor: 'not-allowed' }}
                  value={user?.email || ""}
                  disabled
                />
                <small style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>Email cannot be changed</small>
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  style={inputStyle}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label style={labelStyle}>Member Since</label>
                <input
                  type="text"
                  style={{ ...inputStyle, background: 'rgba(107, 29, 42, 0.03)', cursor: 'not-allowed' }}
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                  disabled
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  rows={4}
                  name="bio"
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  maxLength={1000}
                />
                <small style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{formData.bio.length}/1000 characters</small>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={saving}>
                {saving ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }} />
                    Saving...
                  </>
                ) : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account */}
      <div className="lx-card" style={{ marginBottom: 0 }}>
        <div className="lx-card-body">
          <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 12 }}>Delete Account</h5>
          <h6 style={{ fontSize: 14, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 4 }}>
            Are you sure you want to delete your account?
          </h6>
          <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', marginBottom: 16 }}>
            Permanently removes your account and associated data from the system.
          </p>
          <button
            type="button"
            className="lx-btn"
            style={{
              background: 'rgba(139, 35, 53, 0.08)',
              color: '#8B2335',
              border: '1.5px solid rgba(139, 35, 53, 0.15)',
            }}
            data-bs-toggle="modal"
            data-bs-target="#delete_account"
          >
            Delete Account
          </button>
        </div>
      </div>

      <SettingsModal />
    </LuxuryDashboardLayout>
  )
}

export default StudentSettings
