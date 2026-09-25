import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        
        {/* Desktop Language Toggle */}
        <div className="hidden lg:flex justify-end p-4">
           <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full border border-indigo-200 hover:bg-indigo-100"
          >
            {language === 'en' ? 'हिंदी में स्विच करें' : 'Switch to English'}
          </button>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
