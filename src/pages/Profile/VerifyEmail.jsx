// pages/Profile/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../../api'; 
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying...');
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { refreshUser } = useAuth(); // Hiramin ang refresh function

// VerifyEmail.jsx
useEffect(() => {
  if (token) {
    authApi.verifyEmail(token) // Step 1: Update Database
      .then(async () => {
        console.log("Verified in DB, now refreshing state...");
        
        // Step 2: Kunin ang bagong data mula sa DB (refreshUser)
        await refreshUser(); 
        
        setMessage('✅ Success! Redirecting...');
        
        // Step 3: Lipat sa profile
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      })
      .catch(err => setMessage('❌ Verification Failed.'));
  }
}, [token]);

    return (
        <div style={{ padding: '100px', textAlign: 'center', minHeight: '100vh', background: '#f8f9fa' }}>
            <div className="dashboard-panel" style={{ display: 'inline-block', padding: '40px', borderRadius: '15px' }}>
                <h2 style={{ color: '#007bff' }}>{message}</h2>
                {message.toLowerCase().includes('success') && <div className="loader"></div>}
            </div>
        </div>
    );
}