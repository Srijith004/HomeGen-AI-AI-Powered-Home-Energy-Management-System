import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import {
  frontendGeminiService,
  ChatMessage,
  Recommendation,
  AiAuditReport,
} from '../services/geminiService';
import { Badge } from '../components/common/Badge';

const SUGGESTED_QUERIES = [
  'Which appliance consumes the most electricity?',
  'How can I reduce my electricity bill?',
  'Compare my normal and energy-saving scenarios.',
  'What are the biggest energy-saving opportunities?',
  'Explain my last 7 days of energy consumption.',
  'Give me a household energy-saving plan.',
];

export const GeminiAssistant: React.FC = () => {
  const {
    household,
    appliances,
    totalCurrentPowerDemandKW,
    currentBill,
    scenarioComparison,
  } = useEnergy();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am **HomeGen AI Assistant**, your intelligent residential energy advisor. I can analyze your simulated 3BHK energy usage, identify high-draw appliances, calculate slab tariff savings, and construct personalized optimization plans. Ask me a question or click one of the suggested prompts below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AiAuditReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<{ configured: boolean; model: string }>({
    configured: false,
    model: 'gemini-2.5-flash',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check health on mount
  useEffect(() => {
    frontendGeminiService.checkHealth().then(status => {
      setBackendHealth(status);
    });
  }, []);

  // Fetch initial recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [appliances, currentBill.totalBillINR]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const context = frontendGeminiService.buildContext(
        household.name,
        appliances,
        totalCurrentPowerDemandKW,
        currentBill,
        undefined,
        scenarioComparison
      );
      const res = await frontendGeminiService.getInsights(context);
      setRecommendations(res.recommendations || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = frontendGeminiService.buildContext(
        household.name,
        appliances,
        totalCurrentPowerDemandKW,
        currentBill,
        undefined,
        scenarioComparison
      );

      const history = messages
        .filter(m => m.id !== 'welcome-1')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const res = await frontendGeminiService.sendChat(text, context, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: res.isFallback,
        modelUsed: res.modelUsed,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to communicate with the AI service. Please verify the backend is running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const context = frontendGeminiService.buildContext(
        household.name,
        appliances,
        totalCurrentPowerDemandKW,
        currentBill,
        undefined,
        scenarioComparison
      );
      const rep = await frontendGeminiService.generateReport(context, 'Current Simulation Cycle');
      setAiReport(rep);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Google Gemini AI Assistant
            </h1>
            <Badge variant={backendHealth.configured ? 'teal' : 'neutral'} size="sm">
              {backendHealth.configured ? `@google/genai SDK` : 'Rule-Based Fallback'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Interactive energy consultation, tariff anomaly detection, and AI recommendations.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          <span>{isGeneratingReport ? 'Synthesizing Report...' : 'Generate AI Audit Report'}</span>
        </button>
      </div>

      {/* API Key Status Notice */}
      {!backendHealth.configured && (
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
          <AlertCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Local Rule-Based Energy Advisor Active: </span>
            To enable live cloud Google Gemini intelligence, configure <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950 font-mono text-[11px] text-teal-500">GEMINI_API_KEY</code> in <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950 font-mono text-[11px]">backend/.env</code>. The built-in rule-based fallback answers all household energy questions offline.
          </div>
        </div>
      )}

      {/* AI RECOMMENDATIONS CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Prioritized Energy-Saving Recommendations
            </h2>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={isLoadingRecs}
            className="text-xs text-teal-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingRecs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      rec.priority === 'High'
                        ? 'danger'
                        : rec.priority === 'Medium'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {rec.priority} Priority
                  </Badge>
                  <span className="text-[11px] font-medium text-slate-400 truncate">
                    {rec.relevantAppliance}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {rec.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {rec.explanation}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Est. Savings</span>
                  <span className="font-mono font-semibold text-emerald-500">
                    {rec.estimatedSavingsKWh} kWh/day (~₹{Math.round(rec.estimatedSavingsINR)}/d)
                  </span>
                </div>
                <button
                  onClick={() => handleSendMessage(`Tell me more about how to: ${rec.title}`)}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  Ask AI <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI AUDIT REPORT MODAL / POPUP IF GENERATED */}
      {aiReport && (
        <div className="bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-indigo-950/40 border border-teal-500/30 rounded-xl p-6 shadow-md space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-white">
                Household Energy Audit Statement
              </h2>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed font-medium text-sm">
            {aiReport.executiveSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="font-semibold text-teal-400 mb-2">Key Observations:</h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {aiReport.keyObservations.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400 mb-2">Actionable Recommendations:</h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {aiReport.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT CONTAINER */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1220]/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-xs text-slate-900 dark:text-white block leading-tight">
                HomeGen Energy Assistant
              </span>
              <span className="text-[10px] text-teal-400 font-mono">
                Model: {backendHealth.model || 'local-rule-engine'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Household Context: <strong>{appliances.length} Appliances Loaded</strong>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
                  m.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 ${
                  m.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.isFallback && (
                  <span className="inline-block mb-1 text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    Local Rule-Based Advisor
                  </span>
                )}
                <div>{m.text}</div>
                <div
                  className={`text-[10px] pt-1 ${
                    m.sender === 'user' ? 'text-slate-900/70 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
                <span>HomeGen AI is analyzing your household telemetry...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Queries Chips */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#0B1220]/40 border-t border-slate-200 dark:border-slate-800/60 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 font-semibold">
            Suggested:
          </span>
          {SUGGESTED_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-400 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about electricity bills, high-draw appliances, or tariff optimization..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
