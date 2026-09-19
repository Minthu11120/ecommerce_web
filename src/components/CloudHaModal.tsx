import React, { useState } from 'react';
import {
  X,
  Server,
  Database,
  Activity,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  Terminal,
  Cpu,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { HighAvailabilityStatus, Language } from '../types';
import { POSTGRES_DDL_SCHEMA, runSimulatedSqlQuery, SqlQueryResult } from '../services/dbSimulator';
import { translations } from '../data/translations';

interface CloudHaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  clusterStatus: HighAvailabilityStatus;
  onTriggerFailover: () => void;
}

export const CloudHaModal: React.FC<CloudHaModalProps> = ({
  isOpen,
  onClose,
  language,
  clusterStatus,
  onTriggerFailover,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'architecture' | 'sql_console' | 'ddl_schema'>('architecture');
  const [isFailingOver, setIsFailingOver] = useState(false);
  const [failoverLogs, setFailoverLogs] = useState<string[]>([]);

  // SQL console state
  const [sqlQuery, setSqlQuery] = useState('SELECT id, sku, name, category, stock, price_usd FROM products WHERE stock < 15;');
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(() => runSimulatedSqlQuery('SELECT * FROM products WHERE stock < 15;'));

  const handleExecuteSql = (e: React.FormEvent) => {
    e.preventDefault();
    const res = runSimulatedSqlQuery(sqlQuery);
    setQueryResult(res);
  };

  const handleRunFailoverSimulation = () => {
    setIsFailingOver(true);
    setFailoverLogs([
      'INIT: Health check probe simulated SIGKILL on Primary instance (asia-southeast1)...',
    ]);

    setTimeout(() => {
      setFailoverLogs((prev) => [
        ...prev,
        'DETECT: Liveness probe timeout after 280ms. Consensus reached by 3 witness nodes.',
      ]);
    }, 400);

    setTimeout(() => {
      setFailoverLogs((prev) => [
        ...prev,
        'FAILOVER: Promoting Read Replica (asia-east1) to new WRITER PRIMARY via synchronous WAL flush...',
      ]);
    }, 850);

    setTimeout(() => {
      setFailoverLogs((prev) => [
        ...prev,
        'RECOVERY_OK: Connection pool updated. Failover completed in 1.14 seconds. 0 dropped transactions.',
      ]);
      setIsFailingOver(false);
      onTriggerFailover();
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-cloud-ha"
        className="relative w-full max-w-4xl bg-stone-900 text-stone-100 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-stone-800"
      >
        {/* Header */}
        <div className="bg-stone-950 p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-700/60 rounded-lg text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-white">
                  {t.cloud.title}
                </h2>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-700/50">
                  HA-CLUSTER ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{t.cloud.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-6 gap-6 text-xs font-semibold uppercase tracking-wider text-stone-400">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'architecture' ? 'border-amber-400 text-amber-300' : 'border-transparent hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Multi-Region Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('sql_console')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sql_console' ? 'border-amber-400 text-amber-300' : 'border-transparent hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive SQL Console</span>
          </button>
          <button
            onClick={() => setActiveTab('ddl_schema')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ddl_schema' ? 'border-amber-400 text-amber-300' : 'border-transparent hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>PostgreSQL DDL Schema</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Architecture Node Map */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Node 1: Edge & CDN */}
                <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-300">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span>Edge CDN &amp; Proxy</span>
                    </span>
                    <span className="text-emerald-400 font-mono">94.6% HIT</span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Brotli/AVIF low-bandwidth optimization engine for Yangon &amp; global edge networks.
                  </div>
                  <div className="text-[11px] font-mono text-stone-400 pt-1 border-t border-stone-800">
                    Anycast VIP: 34.149.208.91
                  </div>
                </div>

                {/* Node 2: Primary PostgreSQL */}
                <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-300">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>PostgreSQL 16 Primary</span>
                    </span>
                    <span className="text-emerald-400 font-mono">ONLINE</span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Region: {clusterStatus.primaryDatabase.region}
                  </div>
                  <div className="text-[11px] font-mono text-stone-400 pt-1 border-t border-stone-800 flex justify-between">
                    <span>Latency: {clusterStatus.primaryDatabase.latencyMs}ms</span>
                    <span>Pool: {clusterStatus.primaryDatabase.connections} conns</span>
                  </div>
                </div>

                {/* Node 3: Synchronous Standby Replica */}
                <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-300">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                      <span>Sync Read Replica</span>
                    </span>
                    <span className="text-amber-300 font-mono">STANDBY</span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Region: {clusterStatus.replicaDatabase.region}
                  </div>
                  <div className="text-[11px] font-mono text-stone-400 pt-1 border-t border-stone-800 flex justify-between">
                    <span>Replication Lag: 1.2ms</span>
                    <span>Sync: Zero-loss</span>
                  </div>
                </div>
              </div>

              {/* Failover Simulator Trigger Section */}
              <div className="p-5 bg-stone-950/90 rounded-xl border border-amber-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-200">
                      {t.cloud.failoverSimulator}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-xl">
                      {t.cloud.failoverNotice}
                    </p>
                  </div>
                  <button
                    id="btn-trigger-failover-sim"
                    onClick={handleRunFailoverSimulation}
                    disabled={isFailingOver}
                    className="px-4 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isFailingOver ? 'Failing Over...' : 'Trigger Automated Failover'}</span>
                  </button>
                </div>

                {/* Failover Telemetry Log Feed */}
                {failoverLogs.length > 0 && (
                  <div className="mt-3 p-3 bg-black rounded-lg border border-stone-800 font-mono text-xs space-y-1.5 animate-in fade-in">
                    {failoverLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-stone-500">{idx + 1}.</span>
                        <span className={idx === failoverLogs.length - 1 ? 'text-emerald-400 font-bold' : 'text-stone-300'}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql_console' && (
            <div className="space-y-4">
              {/* SQL Query Box */}
              <form onSubmit={handleExecuteSql} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono text-amber-300 font-bold">SQL Query Console (Cloud SQL Postgres):</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setSqlQuery('SELECT * FROM products WHERE stock < 15;')}
                      className="text-[11px] underline hover:text-white"
                    >
                      Low Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlQuery('SELECT * FROM orders;')}
                      className="text-[11px] underline hover:text-white"
                    >
                      Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlQuery('SELECT * FROM products;')}
                      className="text-[11px] underline hover:text-white"
                    >
                      All Garments
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="flex-grow font-mono text-xs bg-stone-950 border border-stone-800 rounded px-3 py-2.5 text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-mono text-xs font-bold"
                  >
                    RUN QUERY
                  </button>
                </div>
              </form>

              {/* Query Result Output */}
              {queryResult && (
                <div className="bg-stone-950 rounded-xl border border-stone-800 overflow-hidden text-xs">
                  <div className="p-3 bg-black border-b border-stone-800 flex justify-between items-center font-mono text-[11px] text-stone-400">
                    <span>
                      Rows: <strong className="text-white">{queryResult.rowCount}</strong> • Execution:{' '}
                      <strong className="text-emerald-400">{queryResult.executionTimeMs}ms</strong>
                    </span>
                    <span className="text-stone-500">{queryResult.planNotes}</span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] border-b border-stone-800">
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} className="p-2.5">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-stone-900/50">
                            {queryResult.columns.map((col) => (
                              <td key={col} className="p-2.5 text-stone-300">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ddl_schema' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-stone-400 font-mono">
                <span>Production PostgreSQL Schema Definition (DDL)</span>
                <span>PostgreSQL 16 Compatible</span>
              </div>
              <pre className="p-4 bg-stone-950 rounded-xl border border-stone-800 font-mono text-[11px] text-stone-300 max-h-96 overflow-y-auto leading-relaxed">
                {POSTGRES_DDL_SCHEMA}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
