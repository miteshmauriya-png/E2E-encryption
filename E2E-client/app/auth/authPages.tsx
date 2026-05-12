import React, { useState } from 'react';
import axios from 'axios';
import { redirect } from "react-router";

const API_URL = 'http://localhost:5000/api';

const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

  return { publicKey, privateKey };
};


const AuthPages = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { publicKey, privateKey } = await generateKeyPair();
      let randomUUID = crypto.randomUUID();

      const res = await axios.post(`${API_URL}/auth/register`, {
        userName: formData.name?.trim(),
        email: formData.email?.toLowerCase().trim(),
        password: formData.password,
        devices: [
          {
            deviceId: randomUUID,
            deviceName: navigator.userAgent || "Unknown Device",
            publicKey: publicKey,
          }
        ]
      });

      localStorage.setItem('privateKey', privateKey);
      localStorage.setItem('deviceId', randomUUID);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setIsLogin(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Login successful!');
      redirect("/chat");
      window.location.href = '/chat';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-300 shadow-md overflow-hidden rounded-md">
          <div className="p-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              {isLogin ? 'Sign in' : 'Create account'}
            </h2>
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">

              {/* Name Field - Only in Register */}
              {!isLogin && (
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] outline-none text-sm rounded-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm text-left font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] outline-none text-sm rounded-sm"
                  placeholder="name@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm text-left font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] outline-none text-sm rounded-sm"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-sm">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0078d4] hover:bg-[#106ebe] rounded-sm disabled:bg-gray-400 text-white font-medium py-3 text-base transition rounded-sm"
                >
                  {loading
                    ? 'Processing...'
                    : isLogin
                      ? 'Sign in'
                      : 'Create account'
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Toggle Section */}
          <div className="border-t border-gray-200 bg-gray-50 px-10 py-5 text-center text-sm">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-[#0078d4] hover:underline font-medium"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-[#0078d4] hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Private key will be stored securely on this device only
        </p>
      </div>
    </div>
  );
};

export default AuthPages;