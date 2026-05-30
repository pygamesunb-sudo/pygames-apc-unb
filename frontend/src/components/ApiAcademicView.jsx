import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layout,
  Database,
  Cpu,
  Calendar,
  Layers,
  Users,
  GitBranch,
  Award,
  Play,
  FileText
} from 'lucide-react';
import { exportAcademicPDF } from '../services/apiAcademicPdfHelper';
import ApiSlideshowView from './ApiSlideshowView';
import {
  VisaoSection,
  InterfaceSection,
  DadosSection,
  AlgoritmoSection,
  CronogramaSection,
  MetodologiaSection
} from './ApiAcademicSubViews';
import './ApiAcademicView.css';

export default function ApiAcademicView() {
  const [activeSubTab, setActiveSubTab] = useState('visao');
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  const subTabs = [
    { id: 'visao', label: 'Visão & Letramento', icon: BookOpen },
    { id: 'interface', label: 'Design & Interface', icon: Layout },
    { id: 'dados', label: 'Estrutura de Dados', icon: Database },
    { id: 'algoritmo', label: 'Pipeline & Sandbox', icon: Cpu },
    { id: 'cronograma', label: 'Sprints & Cronograma', icon: Calendar },
    { id: 'metodologia', label: 'Scrum & Experimento', icon: Layers }
  ];

  return (
    <div className="academic-presentation-container animate-fade-in">
      {/* Cabeçalho Acadêmico Premium com Botões de PDF ABNT e Apresentação */}
      <div className="card academic-header-card">
        <div className="academic-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="academic-badge-icon">
              <GraduationCap size={28} />
            </span>
            <div>
              <h2>Apresentação Acadêmica do Projeto</h2>
              <p>Algoritmos e Programação de Computadores (APC) | CIC - DCC - UnB</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              onClick={() => setSlideshowOpen(true)}
              style={{ 
                background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                padding: '10px 16px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(34, 211, 238, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Play size={16} />
              <span>Apresentar Projeto</span>
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => exportAcademicPDF()} 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                padding: '10px 16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <FileText size={16} />
              <span>Exportar PDF (ABNT)</span>
            </button>
          </div>
        </div>
        <div className="academic-meta-grid" style={{ marginTop: 16 }}>
          <div className="meta-item">
            <Users size={14} className="meta-icon" />
            <span>Orientador: Prof. Edison Ishikawa</span>
          </div>
          <div className="meta-item">
            <Award size={14} className="meta-icon" />
            <span>Co-autor / Proposta: Prof. Rodrigo Duran</span>
          </div>
          <div className="meta-item">
            <GitBranch size={14} className="meta-icon" />
            <span>Linguagem Foco: Python 3.x</span>
          </div>
        </div>
      </div>

      {/* Sub-abas de Navegação Acadêmica */}
      <div className="academic-tabs-grid">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`academic-tab-btn ${activeSubTab === tab.id ? 'academic-tab-btn--active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico por Aba (Importado de ApiAcademicSubViews) */}
      <div className="academic-tab-content">
        {activeSubTab === 'visao' && <VisaoSection />}
        {activeSubTab === 'interface' && <InterfaceSection />}
        {activeSubTab === 'dados' && <DadosSection />}
        {activeSubTab === 'algoritmo' && <AlgoritmoSection />}
        {activeSubTab === 'cronograma' && <CronogramaSection />}
        {activeSubTab === 'metodologia' && <MetodologiaSection />}
      </div>

      <ApiSlideshowView 
        isOpen={slideshowOpen} 
        onClose={() => setSlideshowOpen(false)} 
        initialSlideId={activeSubTab} 
      />
    </div>
  );
}
