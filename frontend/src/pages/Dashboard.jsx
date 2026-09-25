import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Users, IndianRupee, Package, ArrowRight, Plus } from 'lucide-react';
import api from '../services/api';
import KPICard from '../components/KPICard';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const [shop, setShop] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShopForm, setShowShopForm] = useState(false);
  const { t } = useLanguage();

  const [shopForm, setShopForm] = useState({ name: '', type: 'Retail', location: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const shopRes = await api.shop.getShop();
      if (shopRes.data) {
        setShop(shopRes.data);
        const metricsRes = await api.metrics.getMetricsSummary();
        setSummary(metricsRes.data);
      } else {
        setShowShopForm(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowShopForm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      await api.shop.createShop({
        shop_name: shopForm.name,
        business_type: shopForm.type,
        location: shopForm.location
      });
      setShowShopForm(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>{t('loading')}</div>;

  if (showShopForm) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Create Your Shop</h2>
        <form onSubmit={handleCreateShop} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('shopName')}</label>
            <input type="text" required value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('businessType')}</label>
            <select value={shopForm.type} onChange={e => setShopForm({...shopForm, type: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
              <option>Kirana Store</option>
              <option>Retail</option>
              <option>Food & Beverage</option>
              <option>Clothing</option>
              <option>Electronics</option>
              <option>Pharmacy</option>
              <option>Services</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('location')}</label>
            <input type="text" value={shopForm.location} onChange={e => setShopForm({...shopForm, location: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700">Create Shop</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('welcomeBack')}, {shop?.shop_name}</h1>
          <p className="text-gray-500">Here's what's happening with your business today.</p>
        </div>
        <Link to="/data-entry" className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          Add Data
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('todaySales')} value={summary?.today_sales || 0} change={summary?.sales_change} icon={IndianRupee} />
        <KPICard title={t('footfall')} value={summary?.today_footfall || 0} change={summary?.footfall_change} icon={Users} prefix="" />
        <KPICard title={t('expenses')} value={summary?.today_expenses || 0} change={summary?.expense_change} icon={Store} />
        <KPICard title={t('stockValue')} value={summary?.latest_stock_value || 0} change={0} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
             <Link to="/analytics" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="font-medium text-gray-700">View Full Analytics</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link to="/insights" className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
              <span className="font-medium text-indigo-700">Get AI Insights</span>
              <ArrowRight className="w-5 h-5 text-indigo-500" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h2 className="text-lg font-bold text-gray-900 mb-4">{t('recentData')}</h2>
           <div className="text-gray-500 text-sm">
             {summary?.recent_entries?.length > 0 ? (
               <ul className="space-y-3">
                 {summary.recent_entries.map((entry, idx) => (
                   <li key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                     <span>{new Date(entry.date).toLocaleDateString()}</span>
                     <span className="font-medium text-gray-900">₹{entry.sales}</span>
                   </li>
                 ))}
               </ul>
             ) : (
               <p>No recent data found.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
