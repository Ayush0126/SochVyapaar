import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { CheckCircle, Play, ThumbsUp, ThumbsDown, HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

const History = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState('actions');
  const [actions, setActions] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [impacts, setImpacts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    try {
      const res = await api.actions.getActions();
      setActions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await api.insights.getInsights();
      setAnalyses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'actions') {
      fetchActions();
    } else {
      fetchAnalyses();
    }
  }, [tab]);

  const handleStart = async (id) => {
    try {
      await api.actions.updateAction(id, { status: 'started' });
      fetchActions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.actions.updateAction(id, { status: 'completed' });
      fetchActions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFeedback = async (id, result) => {
    try {
      await api.actions.updateAction(id, { result });
      // Fetch impact data
      const impactRes = await api.actions.getActionImpact(id);
      setImpacts(prev => ({ ...prev, [id]: impactRes.data }));
      fetchActions();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      started: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">{t('history')}</h1>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 ${tab === 'actions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('actions')}
        >
          Tracked Actions
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 ${tab === 'analyses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('analyses')}
        >
          Past Analyses
        </button>
      </div>

      {loading ? (
        <div>{t('loading')}</div>
      ) : (
        <div>
          {tab === 'actions' && (
            <div className="space-y-4">
              {actions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No actions tracked yet.</div>
              ) : (
                actions.map(action => (
                  <div key={action.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{action.action}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(action.status)}
                          <span className="text-sm text-gray-500">
                            Created: {new Date(action.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {action.status === 'pending' && (
                          <button
                            onClick={() => handleStart(action.id)}
                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 text-sm"
                          >
                            <Play className="w-4 h-4 mr-1" /> Start
                          </button>
                        )}
                        {action.status === 'started' && (
                          <button
                            onClick={() => handleComplete(action.id)}
                            className="flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback section for completed actions */}
                    {action.status === 'completed' && !action.result && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Did this action help?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleFeedback(action.id, 'yes')} className="flex items-center px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 text-sm">
                            <ThumbsUp className="w-4 h-4 mr-1" /> Yes
                          </button>
                          <button onClick={() => handleFeedback(action.id, 'no')} className="flex items-center px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 text-sm">
                            <ThumbsDown className="w-4 h-4 mr-1" /> No
                          </button>
                          <button onClick={() => handleFeedback(action.id, 'not_sure')} className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 text-sm">
                            <HelpCircle className="w-4 h-4 mr-1" /> Not Sure
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show feedback result */}
                    {action.result && (
                      <div className="mt-3 text-sm text-gray-600">
                        Feedback: <span className="font-medium capitalize">{action.result.replace('_', ' ')}</span>
                      </div>
                    )}

                    {/* Show impact comparison */}
                    {impacts[action.id] && impacts[action.id].before_avg_daily_sales && (
                      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <h4 className="text-sm font-semibold text-indigo-900 mb-2">Before vs After Comparison</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Before (Avg Daily Sales)</p>
                            <p className="text-lg font-bold text-gray-900">₹{Math.round(impacts[action.id].before_avg_daily_sales)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">After (Avg Daily Sales)</p>
                            <p className="text-lg font-bold text-gray-900">₹{Math.round(impacts[action.id].after_avg_daily_sales)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center">
                          {impacts[action.id].impact_percentage >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          <span className={`font-semibold ${impacts[action.id].impact_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {impacts[action.id].impact_percentage >= 0 ? '+' : ''}{impacts[action.id].impact_percentage.toFixed(1)}%
                          </span>
                          <span className="text-gray-500 ml-2 text-xs">change observed after action</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'analyses' && (
            <div className="space-y-4">
              {analyses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No analyses generated yet.</div>
              ) : (
                analyses.map(analysis => (
                  <div key={analysis.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{analysis.root_cause}</h3>
                        <p className="text-sm text-gray-500 mt-1">{analysis.explanation}</p>
                      </div>
                      <span className="text-sm text-gray-400">{new Date(analysis.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm text-gray-600">
                      <span>Sales: <span className={analysis.sales_change < 0 ? 'text-red-600' : 'text-green-600'}>{analysis.sales_change > 0 ? '+' : ''}{analysis.sales_change}%</span></span>
                      <span>Footfall: <span className={analysis.footfall_change < 0 ? 'text-red-600' : 'text-green-600'}>{analysis.footfall_change > 0 ? '+' : ''}{analysis.footfall_change}%</span></span>
                      <span>Expenses: <span className={analysis.expense_change > 5 ? 'text-red-600' : 'text-green-600'}>{analysis.expense_change > 0 ? '+' : ''}{analysis.expense_change}%</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
