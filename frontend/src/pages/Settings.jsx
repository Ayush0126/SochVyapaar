import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [shop, setShop] = useState({ shop_name: '', business_type: '', location: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.shop.getShop();
        if (res.data) setShop(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchShop();
  }, []);

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    try {
      await api.shop.updateShop(shop);
      setMessage(t('success'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(t('error'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
      
      {message && (
        <div className={`p-4 rounded-md ${message === t('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('language')}</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-md ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-2 rounded-md ${language === 'hi' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            हिंदी
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" disabled value={user?.name || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" disabled value={user?.email || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm p-2 border" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Shop Settings</h2>
        <form onSubmit={handleUpdateShop} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('shopName')}</label>
            <input type="text" value={shop.shop_name} onChange={e => setShop({...shop, shop_name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('businessType')}</label>
            <select value={shop.business_type} onChange={e => setShop({...shop, business_type: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
              <option>Retail</option>
              <option>Food & Beverage</option>
              <option>Services</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('location')}</label>
            <input type="text" value={shop.location} onChange={e => setShop({...shop, location: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            {t('updateShop')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
