'use client';
import React, { useState } from 'react';

export default function PasswordModal({
  open,
  onSubmit,
  onClose,
}: {
  open: boolean;
  onSubmit: (pwd: string) => void;
  onClose: () => void;
}) {
  const [pwd, setPwd] = useState('');
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        padding: 30,
        borderRadius: 10,
        width: '90%',
        maxWidth: 400,
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontSize: '22px', marginBottom: '15px', color: '#000' }}>Enter encryption password</h3>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            margin: '15px 0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            color: '#000'
          }}
        />
        <button
          onClick={() => { onSubmit(pwd); setPwd('') }}
          disabled={!pwd}
          style={{
            marginRight: 10,
            padding: '10px 20px',
            fontSize: '16px',
            color: '#fff',
            backgroundColor: '#0070f3',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005bb5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
        >
          OK
        </button>
        <button
          onClick={() => { onClose(); setPwd('') }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            color: '#333',
            backgroundColor: '#eee',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ccc'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eee'}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
