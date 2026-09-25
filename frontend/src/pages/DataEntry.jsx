import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import VoiceInput from '../components/VoiceInput';
import { CheckCircle, X, Loader2 } from 'lucide-react';

const DataEntry = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sales: '',
    expenses: '',
    customer_footfall: '',
    stock_value: ''
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [message, setMessage] = useState('');
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceConfirm, setVoiceConfirm] = useState(null); // {parsed, original_text}

  const fetchRecent = async () => {
    try {
      const res = await api.metrics.getMetrics();
      setRecentEntries(res.data.slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.metrics.addMetrics({
        date: formData.date,
        sales: parseFloat(formData.sales),
        expenses: parseFloat(formData.expenses),
        footfall: parseInt(formData.customer_footfall),
        stock_value: parseFloat(formData.stock_value)
      });
      setMessage(t('dataSaved'));
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sales: '',
        expenses: '',
        customer_footfall: '',
        stock_value: ''
      });
      fetchRecent();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(t('error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.metrics.deleteMetrics(id);
      fetchRecent();
    } catch (error) {
      console.error(error);
    }
  };

  // Voice input handler
  const handleVoiceResult = async (transcript) => {
    if (!transcript) return;
    setVoiceParsing(true);
    try {
      const res = await api.metrics.parseVoice(transcript, language);
      const parsed = res.data.parsed;
      setVoiceConfirm({
        parsed,
        original_text: res.data.original_text,
        method: res.data.method
      });
    } catch (error) {
      alert('Could not parse voice input. Please try again or enter manually.');
    } finally {
      setVoiceParsing(false);
    }
  };

  // Confirm voice-parsed data
  const handleVoiceConfirm = () => {
    const p = voiceConfirm.parsed;
    setFormData(prev => ({
      ...prev,
      sales: p.sales != null ? String(p.sales) : prev.sales,
      expenses: p.expenses != null ? String(p.expenses) : prev.expenses,
      customer_footfall: p.footfall != null ? String(p.footfall) : prev.customer_footfall,
      stock_value: p.stock_value != null ? String(p.stock_value) : prev.stock_value,
    }));
    setVoiceConfirm(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Voice Input Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6">
        <h2 className="text-lg font-bold text-indigo-900 mb-2 text-center">
          🎤 {language === 'hi' ? 'आवाज़ से डेटा दर्ज करें' : 'Voice Data Entry'}
        </h2>
        <p className="text-sm text-indigo-600 text-center mb-4">
          {language === 'hi'
            ? '"आज बिक्री 8500, खर्चा 3200 और 110 ग्राहक आए"'
            : '"Today sales were 8500, expenses 3200 and 110 customers"'}
        </p>

        {voiceParsing ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-500">
              {language === 'hi' ? 'समझ रहा हूँ...' : 'Parsing your speech...'}
            </p>
          </div>
        ) : (
          <VoiceInput onResult={handleVoiceResult} disabled={voiceParsing} />
        )}
      </div>

      {/* Voice Confirmation Modal */}
      {voiceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'hi' ? '✅ पुष्टि करें' : '✅ Confirm Data'}
              </h3>
              <button onClick={() => setVoiceConfirm(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
              "{voiceConfirm.original_text}"
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium">{t('sales')}</p>
                <p className="text-xl font-bold text-green-800">
                  {voiceConfirm.parsed.sales != null ? `₹${voiceConfirm.parsed.sales}` : '—'}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 font-medium">{t('expenses')}</p>
                <p className="text-xl font-bold text-red-800">
                  {voiceConfirm.parsed.expenses != null ? `₹${voiceConfirm.parsed.expenses}` : '—'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">{t('footfall')}</p>
                <p className="text-xl font-bold text-blue-800">
                  {voiceConfirm.parsed.footfall != null ? voiceConfirm.parsed.footfall : '—'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 font-medium">{t('stockValue')}</p>
                <p className="text-xl font-bold text-purple-800">
                  {voiceConfirm.parsed.stock_value != null ? `₹${voiceConfirm.parsed.stock_value}` : '—'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {voiceConfirm.method === 'ai' ? '✨ Parsed by AI' : '⚙️ Parsed by pattern matching'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setVoiceConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleVoiceConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <CheckCircle className="w-4 h-4" />
                {language === 'hi' ? 'भरें' : 'Fill Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dataEntry')}</h2>
        {message && (
          <div className={`p-4 mb-6 rounded-md ${message === t('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('sales')}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input type="number" min="0" step="0.01" required value={formData.sales} onChange={e => setFormData({...formData, sales: e.target.value})} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('expenses')}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input type="number" min="0" step="0.01" required value={formData.expenses} onChange={e => setFormData({...formData, expenses: e.target.value})} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('footfall')}</label>
            <input type="number" min="0" required value={formData.customer_footfall} onChange={e => setFormData({...formData, customer_footfall: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('stockValue')}</label>
             <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input type="number" min="0" step="0.01" required value={formData.stock_value} onChange={e => setFormData({...formData, stock_value: e.target.value})} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="0.00" />
            </div>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {t('saveData')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('recentData')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('expenses')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('footfall')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{entry.sales}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{entry.expenses}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.footfall}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentEntries.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No data entered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
