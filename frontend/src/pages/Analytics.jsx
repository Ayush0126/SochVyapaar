import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const { t } = useLanguage();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.analytics.getAnalytics(days);
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{t('analytics')}</h1>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(`days${d}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">{t('loading')}</div>
      ) : !data || !data.trends || data.trends.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No data available for the selected period.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('salesTrend')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#4f46e5" name="Sales" />
                <Line type="monotone" dataKey="sales_ma_7" stroke="#9333ea" name="7-Day Avg" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('footfallTrend')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="customer_footfall" fill="#0ea5e9" name="Footfall" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('expenseTrend')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="expenses" fill="#ef4444" stroke="#ef4444" name="Expenses" opacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('revenuePerCustomer')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue_per_customer" stroke="#10b981" name="Rev/Customer" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
