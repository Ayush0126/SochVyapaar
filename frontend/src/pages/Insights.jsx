import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { AlertTriangle, CheckCircle, Lightbulb, PlayCircle, Loader2 } from 'lucide-react';

const Insights = () => {
  const { t, language } = useLanguage();
  const [insights, setInsights] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await api.insights.getInsights();
      setInsights(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.insights.generateInsight(language);
      await fetchInsights();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to generate insight.';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartAction = async (recommendation) => {
    try {
      await api.actions.createAction({
        analysis_id: recommendation.analysis_id,
        action: recommendation.text,
      });
      alert('Action tracked! View it in the History tab.');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('insights')}</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lightbulb className="w-5 h-5 mr-2" />}
          {t('generateInsight')}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-gray-200">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('noInsights')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`p-4 ${insight.severity === 'high' ? 'bg-red-50 border-b border-red-100' : insight.severity === 'medium' ? 'bg-yellow-50 border-b border-yellow-100' : 'bg-green-50 border-b border-green-100'}`}>
                <div className="flex items-center">
                  {insight.severity === 'high' || insight.severity === 'medium' ? (
                    <AlertTriangle className={`w-6 h-6 mr-2 ${insight.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                  ) : (
                    <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                  )}
                  <h2 className="text-lg font-bold text-gray-900">{insight.root_cause}</h2>
                  <span className="ml-auto text-sm text-gray-500">{new Date(insight.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-6">{insight.explanation}</p>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('evidence')}:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    {insight.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">{t('recommendations')}:</h3>
                  <div className="space-y-4">
                    {insight.recommendations.map((rec, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{i + 1}. {rec.action}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('estimatedCost')}: {rec.estimated_cost}</p>
                        </div>
                        <button
                          onClick={() => handleStartAction({ analysis_id: insight.id, text: rec.action })}
                          className="mt-3 sm:mt-0 flex items-center px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          {t('startAction')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insights;
