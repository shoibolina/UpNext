import React, { useState, useEffect } from 'react';
import { fetchCsrfToken, getCsrfToken } from '../../utils/csrf';

export default function ForgotPassword() {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        <p className="mb-4">
          Click below to open the password reset form:
        </p>
        <a
          href="http://localhost:8000/api/password-reset/"
          className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reset Password
        </a>
      </div>
    );
  }
