import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LineChart, Search, Sparkles, TrendingUp, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Landing = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      title: "Daily Business Data",
      description: "Track sales, expenses, and footfall daily",
      icon: LineChart
    },
    {
      title: "Root Cause Analysis",
      description: "Understand WHY performance changed",
      icon: Search
    },
    {
      title: "Affordable Recommendations",
      description: "Get practical, low-cost actions",
      icon: Sparkles
    },
    {
      title: "Business Analytics",
      description: "Visual trends and patterns",
      icon: TrendingUp
    },
    {
      title: "AI Insights",
      description: "Intelligent explanations in your language",
      icon: Languages
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          SochVyapaar
        </h1>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
            {t('login')}
          </Link>
          <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition">
            {t('getStarted')}
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
          <span className="block">{t('heroSubtitle')}</span>
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto mb-10">
          {t('heroDescription')}
        </p>
        
        <div className="flex justify-center gap-4 mb-24">
          <Link to="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
            {t('getStarted')}
          </Link>
          <Link to="/login" className="bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-50 transition">
            {t('login')}
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-12">{t('features')}</h2>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>© 2026 SochVyapaar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
