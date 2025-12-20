import React from 'react';
import { useNavigate } from 'react-router-dom';

const Report = () => {
    const navigate = useNavigate();

    return (
        <div className="layout start-screen" style={{ flexDirection: 'column', height: '100vh', justifyContent: 'center' }}>
            <h1>📊 Farm Report</h1>
            <p>Report Generation Feature Coming Soon...</p>
            <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Back to Home</button>
        </div>
    );
};

export default Report;
