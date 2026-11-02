import React from 'react';
import {
  Info,
  Zap,
  Cpu,
  Target,
  AlertTriangle,
  Lightbulb,
  Layers,
  Code,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Terminal,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const About: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title & Tagline Header */}
      <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Academic Project Demonstration</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          HomeGen AI – AI-Powered Home Energy Management System
        </h1>

        <p className="text-base font-semibold text-teal-500 dark:text-teal-400 tracking-wide">
          Monitor. Control. Predict. Optimize.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed">
          An educational and academic software platform demonstrating intelligent household electricity monitoring, appliance-level energy management, progressive slab billing estimation, reproducible synthetic telemetry generation, time-series forecasting, and Google Gemini GenAI energy advisory.
        </p>
      </div>

      {/* SIMULATION MANDATE ALERT */}
      <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-3.5 text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-1">
            Pure Software Simulation Notice
          </span>
          HomeGen AI is an educational software simulation. It operates without physical meters, ESP32 microcontrollers, IoT current transformers, or relays. All appliance telemetry readings, live monitoring graphs, and control operations are mathematical simulations engineered for demonstration.
        </div>
      </div>

      {/* OBJECTIVE, PROBLEM, & SOLUTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Objective</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To provide individual household occupants and academic researchers with a transparent, interactive simulator to study residential electricity demand profiles, progressive slab tariffs, and energy conservation strategies.
          </p>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Problem</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conventional residential electricity meters provide only delayed monthly lump-sum utility bills without appliance-level attribution, obscure progressive slab tariffs, and offer zero proactive forecasting to mitigate peak-rate creep.
          </p>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Proposed Solution</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            HomeGen AI delivers virtual submetering, diurnal thermodynamic load modeling (compressor cycling, inverter staging), progressive slab calculation, multi-horizon mathematical forecasting, and Google Gemini AI insights.
          </p>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            System Architecture
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800/80 text-xs font-mono space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <span className="font-bold text-teal-400 block mb-1">CLIENT BROWSER</span>
              <p className="text-[11px] text-slate-300">
                React 19 + TypeScript + Vite + Tailwind CSS + Recharts + LocalStorage (homegen_ai_state_v1)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-bold text-blue-400 block mb-1">LOCAL BACKEND API</span>
              <p className="text-[11px] text-slate-300">
                Node.js + Express REST API (Port 5000) with Strict Validation & Rate Limiting
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <span className="font-bold text-indigo-400 block mb-1">INTELLIGENCE LAYER</span>
              <p className="text-[11px] text-slate-300">
                Official Google GenAI SDK (@google/genai) + Deterministic Local Rule Fallback
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CALCULATION METHODOLOGY FORMULAS */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Calculator className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Engineering & Calculation Formulas
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">A. Energy Consumption</span>
            <code className="text-teal-400 font-mono block">E(kWh) = Power (W) × Duration (hours) / 1000</code>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">B. Total Power Demand</span>
            <code className="text-teal-400 font-mono block">Demand (kW) = ∑ Operating Power (W) / 1000</code>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">C. Progressive Slab Tariff</span>
            <code className="text-teal-400 font-mono block">Total Energy Charge = ∑ (Slab Units × Slab Rate)</code>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">D. Energy Savings Delta</span>
            <code className="text-teal-400 font-mono block">Energy Saved = Baseline (kWh) - Optimized (kWh)</code>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">E. Savings Percentage</span>
            <code className="text-teal-400 font-mono block">Savings % = (Saved / Baseline) × 100</code>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">F. Appliance Monthly Cost</span>
            <code className="text-teal-400 font-mono block">Cost = (Watts × Daily Hours × 30 / 1000) × Tariff</code>
          </div>
        </div>
      </div>

      {/* TECHNOLOGY STACK */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Code className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Technology Stack & Libraries
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Frontend</span>
            <span className="font-semibold text-slate-900 dark:text-white">React 19 + TypeScript</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Build Tool</span>
            <span className="font-semibold text-slate-900 dark:text-white">Vite 8</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Styling</span>
            <span className="font-semibold text-slate-900 dark:text-white">Tailwind CSS 4</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Data Visualization</span>
            <span className="font-semibold text-slate-900 dark:text-white">Recharts</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Backend API</span>
            <span className="font-semibold text-slate-900 dark:text-white">Node.js + Express</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Generative AI</span>
            <span className="font-semibold text-slate-900 dark:text-white">Google GenAI SDK</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Seeded PRNG</span>
            <span className="font-semibold text-slate-900 dark:text-white">Mulberry32</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Testing Suite</span>
            <span className="font-semibold text-slate-900 dark:text-white">Vitest + Supertest</span>
          </div>
        </div>
      </div>

      {/* PROJECT LIMITATIONS */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-3 text-xs leading-relaxed text-slate-400">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Project Limitations & Boundaries
        </h3>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Pure software simulation — does not interface with smart meters or current transformers.</li>
          <li>Default demonstration tariff does not represent official TANGEDCO rates and is customizable for testing.</li>
          <li>Forecasting employs transparent rolling averages and day-of-week decomposition rather than physical building thermodynamic models.</li>
          <li>Cloud AI insights require an optional Google Gemini API key configured in backend environment variables. Offline fallback operates automatically.</li>
        </ul>
      </div>
    </div>
  );
};
