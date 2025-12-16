import React from 'react';
import { AnalysisResult, InsightType } from '../types';
import { INSIGHT_STYLES } from '../constants';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AlertTriangle, TrendingUp, Info, Zap, ArrowUpRight, ArrowDownRight, Activity, Target, BrainCircuit, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {

  const renderChart = () => {
    const commonProps = {
        data: data.chartData,
        margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };

    switch (data.chartType) {
        case 'bar':
            return (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                        cursor={{ fill: '#334155', opacity: 0.2 }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ color: '#818cf8' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                         {data.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                    </Bar>
                </BarChart>
            );
        case 'line':
            return (
                <LineChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff' }} />
                </LineChart>
            );
        case 'pie':
            return (
                <PieChart>
                    <Pie
                        data={data.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    />
                    <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                    />
                </PieChart>
            );
        case 'area':
        default:
            return (
                <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            );
    }
  };

  const getChartIcon = () => {
      switch(data.chartType) {
          case 'bar': return <BarChart3 className="w-5 h-5 text-indigo-400" />;
          case 'pie': return <PieIcon className="w-5 h-5 text-indigo-400" />;
          case 'line': return <LineIcon className="w-5 h-5 text-indigo-400" />;
          default: return <Activity className="w-5 h-5 text-indigo-400" />;
      }
  };

  const getChartTitle = () => {
      switch(data.chartType) {
          case 'bar': return "Comparativo de Métricas";
          case 'pie': return "Distribuição & Proporção";
          case 'line': return "Evolução Temporal";
          default: return "Análise de Tendência";
      }
  };

  return (
    <div id="dashboard-content" className="space-y-6 pb-10">
      
      {/* Hero Summary */}
      <div className="glass-card rounded-3xl p-8 animate-enter border-t border-indigo-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase">
                    <BrainCircuit className="w-4 h-4" />
                    <span>Síntese de Inteligência</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light text-white leading-tight">
                    "{data.summary}"
                </h2>
            </div>
            <div className="hidden md:block">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Target className="text-indigo-400" size={32} />
                 </div>
            </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi, index) => (
          <div 
            key={index} 
            className="glass-card p-6 rounded-2xl hover:bg-slate-800/80 transition-all duration-300 animate-enter group border-l-4 border-l-transparent hover:border-l-indigo-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg transition-colors ${
                    kpi.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
                    kpi.trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 
                    'bg-slate-700/30 text-slate-400'
                }`}>
                    {kpi.trend === 'up' && <ArrowUpRight size={16} />}
                    {kpi.trend === 'down' && <ArrowDownRight size={16} />}
                    {kpi.trend === 'neutral' && <Activity size={16} />}
                </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl animate-enter delay-200 min-h-[450px] flex flex-col border border-slate-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    {getChartIcon()}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{getChartTitle()}</h3>
                    <p className="text-xs text-slate-500">Visualização adaptativa gerada por IA</p>
                </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Matrix (Insights) */}
        <div className="glass-panel p-6 rounded-3xl animate-enter delay-300 lg:col-span-1 flex flex-col border border-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-400" />
             </div>
             <div>
                <h3 className="text-lg font-semibold text-white">Matriz de Ação</h3>
                <p className="text-xs text-slate-500">Insights priorizados por impacto</p>
             </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
            {data.insights.map((insight, index) => {
               const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES[InsightType.INFO];
               return (
                <div 
                    key={index} 
                    className={`relative p-5 rounded-2xl border bg-gradient-to-br ${style} transition-all duration-300 hover:translate-x-1 hover:shadow-lg`}
                >
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 rounded-full bg-black/20 backdrop-blur-sm shrink-0">
                            {insight.type === InsightType.PROBLEM && <AlertTriangle className="w-4 h-4" />}
                            {insight.type === InsightType.OPPORTUNITY && <TrendingUp className="w-4 h-4" />}
                            {insight.type === InsightType.INFO && <Info className="w-4 h-4" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold mb-1.5 opacity-100">{insight.title}</h4>
                            <p className="text-xs opacity-80 leading-relaxed font-medium">{insight.description}</p>
                        </div>
                    </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;