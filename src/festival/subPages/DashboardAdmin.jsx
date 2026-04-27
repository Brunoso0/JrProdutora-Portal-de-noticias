import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Music, UserCheck, AlertCircle, TrendingUp } from 'lucide-react';
import '../styles/DashboardAdmin.css';

const DashboardAdmin = ({ onNavigateTab }) => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    candidatesByStatus: {},
    candidatesByPhase: {},
    activeSessions: 0,
    eliminatedCandidates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const apiBase = process.env.API_FESTIVAL;
      const token = localStorage.getItem('festivalAdminToken') || localStorage.getItem('token');

      // Fetch all candidates to calculate stats
      const response = await axios.get(`${apiBase}/api/admin/candidates?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const candidates = response.data?.candidates || response.data?.data || [];
      const paginationTotal = Number(response.data?.pagination?.total ?? candidates.length);
      
      // Calculate statistics
      const totalCandidates = Number.isFinite(paginationTotal) ? paginationTotal : candidates.length;
      const statusCounts = {};
      const phaseCounts = {};
      let activeSessions = 0;
      let eliminatedCount = 0;

      candidates.forEach((candidate) => {
        // Count by status
        const status = candidate.status || 'indefinido';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Count by phase
        const phase = candidate.current_phase || 'indefinido';
        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;

        // Count eliminated
        if (status === 'eliminado') {
          eliminatedCount++;
        }

        // Count active sessions (if has sessions_count)
        if (candidate.sessions_count && candidate.sessions_count > 0) {
          activeSessions++;
        }
      });

      setStats({
        totalCandidates,
        candidatesByStatus: statusCounts,
        candidatesByPhase: phaseCounts,
        activeSessions,
        eliminatedCandidates: eliminatedCount,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setErrorMsg('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-icon">
        <Icon size={24} />
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {errorMsg && (
        <div className="dashboard-alert alert-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard - Visão Geral</h1>
        <button className="dashboard-refresh-btn" onClick={loadDashboardStats}>
          <TrendingUp size={18} />
          Atualizar
        </button>
      </div>

      {/* Main Stats */}
      <div className="dashboard-grid-main">
        <StatCard
          icon={Users}
          title="Total de Candidatos"
          value={stats.totalCandidates}
          color="blue"
        />
        <StatCard
          icon={Music}
          title="Com Sessões Ativas"
          value={stats.activeSessions}
          color="green"
          subtitle={stats.totalCandidates > 0 ? `${Math.round((stats.activeSessions / stats.totalCandidates) * 100)}%` : '0%'}
        />
        <StatCard
          icon={UserCheck}
          title="Candidatos Eliminados"
          value={stats.eliminatedCandidates}
          color="red"
        />
        <StatCard
          icon={AlertCircle}
          title="Ativos"
          value={stats.candidatesByStatus['ativo'] || 0}
          color="purple"
        />
      </div>

      {/* Status Breakdown */}
      <div className="dashboard-section">
        <h2 className="section-title">Status dos Candidatos</h2>
        <div className="dashboard-grid-2col">
          <div className="status-breakdown">
            <h3>Status</h3>
            <div className="breakdown-list">
              {Object.entries(stats.candidatesByStatus).map(([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-label">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="breakdown-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Breakdown */}
          <div className="phase-breakdown">
            <h3>Fase Atual</h3>
            <div className="breakdown-list">
              {Object.entries(stats.candidatesByPhase).map(([phase, count]) => (
                <div key={phase} className="breakdown-item">
                  <span className="breakdown-label">
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </span>
                  <span className="breakdown-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Ações Rápidas</h2>
        <div className="quick-actions">
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('artistas')}
          >
            <Music size={18} />
            Ver Candidatos
          </button>
          <button
            type="button"
            className="action-btn action-btn-secondary"
            onClick={() => onNavigateTab && onNavigateTab('sessoes')}
          >
            <Users size={18} />
            Gerenciar Sessões
          </button>
          <button
            type="button"
            className="action-btn action-btn-secondary"
            onClick={() => onNavigateTab && onNavigateTab('jurados')}
          >
            <UserCheck size={18} />
            Adicionar Jurado
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="dashboard-summary">
        <p>
          Sistema com <strong>{stats.totalCandidates}</strong> candidatos,
          sendo <strong>{stats.candidatesByStatus['ativo'] || 0}</strong> ativos.
          {stats.activeSessions > 0 && (
            <>
              {' '}<strong>{stats.activeSessions}</strong> candidatos com sessões vinculadas.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default DashboardAdmin;
