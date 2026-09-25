import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BarChart3, Brain, Clock, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('dataEntry'), path: '/data-entry', icon: PlusCircle },
    { name: t('analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('insights'), path: '/insights', icon: Brain },
    { name: t('history'), path: '/history', icon: Clock },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <span className="text-2xl font-bold text-indigo-600">SochVyapaar</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
