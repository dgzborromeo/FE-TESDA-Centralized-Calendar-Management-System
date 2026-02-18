import { useState, useEffect } from 'react';
import { profiles as profilesApi } from '../../api'; 
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    profilesApi.getMe()
      .then(data => {
        setProfile(data);
        setFormData(data); // I-sync ang form sa current data mula sa DB
        setLoading(false);
      })
      .catch(err => {
        console.error("Profile Fetch Error:", err);
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSave = async () => {
    const data = new FormData();
    // Siguraduhin na ang mga keys dito ay tugma sa controller.saveProfile mo
    data.append('first_name', formData.first_name || '');
    data.append('last_name', formData.last_name || '');
    data.append('middle_name', formData.middle_name || '');
    data.append('designation', formData.designation || '');
    data.append('office', formData.office || '');
    data.append('division', formData.division || '');
    data.append('cluster', formData.cluster || '');
    data.append('phone_number', formData.phone_number || '');
    data.append('province_district', formData.province_district || '');
    data.append('region', formData.region || '');
    
    if (selectedFile) {
      data.append('picture', selectedFile);
    }

    try {
      setLoading(true);
      await profilesApi.save(data); 
      setIsEditing(false);
      setPreviewUrl(null);
      await loadProfile(); 
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save profile.");
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading profile...</div>;
  if (!profile) return <div className="dashboard-loading">No profile data found.</div>;

  const initials = `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=007bff&color=fff&size=150&bold=true`;
  const fullName = `${profile.first_name} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name}`;

  return (
    <div className="dashboard profile-page">
      <div className="profile-container">
        {/* Main Info Panel */}
        <section className={`dashboard-panel profile-main ${isEditing ? 'editing-mode' : ''}`}>
          <div className="profile-header">
            <div className="profile-header-left">
              <div className="profile-pic-wrapper">
                <img 
                  src={previewUrl || (profile.picture ? profile.picture : avatarUrl)} 
                  alt="" 
                  className={`profile-img-large ${isEditing ? 'img-edit' : ''}`}
                  onError={(e) => { e.target.src = avatarUrl; }} 
                />
                {isEditing && (
                  <label className="photo-upload-label">
                    <input type="file" onChange={handleFileChange} hidden />
                    <span>Change Photo</span>
                  </label>
                )}
              </div>
              <div className="profile-name-info">
                {isEditing ? (
                  <div className="name-edit-group">
                    <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="First Name" className="edit-input-field" />
                    <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Last Name" className="edit-input-field" />
                  </div>
                ) : (
                  <>
                    <h2>{fullName}</h2>
                    <p className="profile-role-tag">{(profile.user?.role || 'Staff').toUpperCase()}</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="profile-header-right">
              {isEditing ? (
                <div className="edit-actions">
                  <button className="dashboard-btn btn-save btn-rounded" onClick={handleSave}>Save</button>
                  <button className="dashboard-btn btn-cancel btn-rounded" onClick={() => { setIsEditing(false); setPreviewUrl(null); setFormData(profile); }}>Cancel</button>
                </div>
              ) : (
                <button className="dashboard-btn btn-rounded" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <hr className="profile-divider" />

          {/* Detailed Info Grid */}
         <div className="profile-details">
        {[
            { label: 'Designation', name: 'designation' },
            { label: 'Office / Division', name: 'office' },
            { label: 'Phone Number', name: 'phone_number' },
            { label: 'Province / District', name: 'province_district' },
            { label: 'Email Address', name: 'email', isStatic: true }, // Isama na dito
            { label: 'Region', name: 'region' }
        ].map((field) => (
            <div className="detail-group" key={field.name}>
            <label>{field.label}</label>
            
            {isEditing ? (
                /* Logic for Editing */
                field.isStatic ? (
                /* Email is not editable in Profile usually (sa Auth login ito) */
                <span>{profile.user?.email || 'N/A'}</span>
                ) : field.name === 'office' ? (
                <div className="dual-input">
                    <input 
                    type="text" name="office" 
                    value={formData.office || ''} 
                    onChange={handleChange} 
                    placeholder="Office" 
                    className="edit-input-field" 
                    />
                    <span className="input-separator">-</span>
                    <input 
                    type="text" name="division" 
                    value={formData.division || ''} 
                    onChange={handleChange} 
                    placeholder="Division" 
                    className="edit-input-field" 
                    />
                </div>
                ) : (
                <input 
                    type="text" 
                    name={field.name} 
                    value={formData[field.name] || ''} 
                    onChange={handleChange} 
                    className="edit-input-field"
                />
                )
            ) : (
                /* Logic for View Mode */
                field.name === 'email' ? (
                <span>{profile.user?.email || 'N/A'}</span>
                ) : field.name === 'office' ? (
                <span>
                    {profile.office || 'N/A'} 
                    {profile.division ? ` - ${profile.division}` : ''}
                </span>
                ) : (
                <span>{profile[field.name] || 'N/A'}</span>
                )
            )}
            </div>
        ))}
        {/* Tinanggal na natin yung hiwalay na div dito sa labas */}
        </div>
        </section>

        {/* QR Section */}
        <section className="dashboard-panel profile-qr-section">
          <h2>Digital QR ID</h2>
          <div className="qr-wrapper">
            {profile.qr_code ? (
              <img src={`${profile.qr_code}?t=${Date.now()}`} alt="User QR Code" className="qr-image" />
            ) : (
              <div className="qr-placeholder">
                <span>QR Code not yet generated</span>
              </div>
            )}
          </div>
          {!isEditing && profile.qr_code && (
            <a 
                href={profile.qr_code} 
                download={`${profile.last_name}_QR.png`}
                className="dashboard-btn btn-full btn-rounded" 
                style={{ marginTop: '20px', textAlign: 'center', textDecoration: 'none', display: 'block' }}
                >
                Download QR ID
                </a>
          )}
        </section>
      </div>

      <div className="profile-extra-grid">
        <section className="dashboard-panel">
          <h3>National Certificates (NC)</h3>
          <div className="info-placeholder">
            <p>No certificates recorded.</p>
          </div>
        </section>

        <section className="dashboard-panel">
          <h3>Programs & Meeting Attended</h3>
          <div className="info-placeholder">
            <p>No recent events or logs found.</p>
          </div>
        </section>
      </div>
    </div>
  );
}