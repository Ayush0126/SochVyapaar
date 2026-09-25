import React from 'react';
import { Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ toggleSidebar }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="bg-white border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between px-4 h-16">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <span className="text-xl font-bold text-indigo-600">SochVyapaar</span>

        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full border border-indigo-200 hover:bg-indigo-100"
        >
          {language === 'en' ? 'हि' : 'EN'}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
