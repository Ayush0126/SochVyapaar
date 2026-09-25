import React from 'react';

const KPICard = ({ title, value, change, icon: Icon, prefix = '₹' }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </h3>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
