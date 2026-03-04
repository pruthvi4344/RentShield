"use client";

import { useState } from "react";

const weeklyViews = [32, 45, 28, 67, 54, 80, 43];
const weeklyMessages = [3, 5, 2, 8, 6, 9, 4];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MiniBar({ values, color, height = 80 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className={`w-full rounded-t-md ${color} transition-all duration-500`}
            style={{ height: `${(v / max) * height}px` }}
          />
          <span className="text-[10px] text-slate-400">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

const propertyStats = [
  { title: "Downtown Condo, Toronto", views: 143, messages: 7, saved: 12, requests: 3, rent: 2200, color: "bg-teal-500" },
  { title: "Private Room, Waterloo", views: 98, messages: 4, saved: 6, requests: 2, rent: 850, color: "bg-violet-500" },
  { title: "Basement, Montréal", views: 106, messages: 5, saved: 9, requests: 3, rent: 1100, color: "bg-amber-500" },
];

const metrics = [
  { label: "Total Views This Week", value: "347", change: "+23%", positive: true, icon: "👁️" },
  { label: "Messages Received", value: "15", change: "+5 this week", positive: true, icon: "💬" },
  { label: "Listings Saved by Renters", value: "27", change: "+8 this week", positive: true, icon: "🔖" },
  { label: "Tenant Requests", value: "7", change: "2 pending", positive: null, icon: "📋" },
  { label: "Avg. Response Time", value: "1.2h", change: "Top 10% of landlords", positive: true, icon: "⚡" },
  { label: "Trust Score", value: "92%", change: "+2% this month", positive: true, icon: "⭐" },
];

export default function Analytics() {
  const [period, setPeriod] = useState<"week" | "month">("week");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track your listing performance and renter engagement.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
          {(["week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 capitalize transition-colors ${period === p ? "bg-teal-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.positive === true ? "bg-emerald-100 text-emerald-700" : m.positive === false ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{m.change}</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Listing Views</p>
              <p className="text-xs text-slate-400">This week · 349 total</p>
            </div>
            <span className="text-2xl font-extrabold text-teal-600">349</span>
          </div>
          <MiniBar values={weeklyViews} color="bg-teal-400" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Messages Received</p>
              <p className="text-xs text-slate-400">This week · 37 total</p>
            </div>
            <span className="text-2xl font-extrabold text-violet-600">37</span>
          </div>
          <MiniBar values={weeklyMessages} color="bg-violet-400" />
        </div>
      </div>

      {/* Per-property breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-5">Performance by Property</h3>
        <div className="space-y-5">
          {propertyStats.map((p, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                </div>
                <span className="text-sm font-bold text-slate-900">${p.rent.toLocaleString()}/mo</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                {[
                  { label: "Views", value: p.views, max: 200, bar: "bg-teal-400" },
                  { label: "Messages", value: p.messages, max: 15, bar: "bg-violet-400" },
                  { label: "Saved", value: p.saved, max: 20, bar: "bg-amber-400" },
                  { label: "Requests", value: p.requests, max: 5, bar: "bg-rose-400" },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="font-bold text-slate-700">{stat.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${stat.bar}`} style={{ width: `${(stat.value / stat.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market insight */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <p className="text-sm font-bold text-slate-900 mb-1">Market Insights — Toronto</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="bg-white rounded-xl p-3 border border-teal-100"><p className="text-slate-400 mb-0.5">Avg. Rent (1BR)</p><p className="font-bold text-base text-slate-900">$2,150/mo</p></div>
              <div className="bg-white rounded-xl p-3 border border-teal-100"><p className="text-slate-400 mb-0.5">Avg. Days to Rent</p><p className="font-bold text-base text-slate-900">14 days</p></div>
              <div className="bg-white rounded-xl p-3 border border-teal-100"><p className="text-slate-400 mb-0.5">Active Renters</p><p className="font-bold text-base text-slate-900">3,200+</p></div>
            </div>
            <p className="text-xs text-teal-700 mt-2">Your listings are performing <span className="font-bold">above average</span> for the Toronto market this week.</p>
          </div>
        </div>
      </div>
    </div>
  );
}