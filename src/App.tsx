// src/App.tsx
// --- VERSÃO COM LAZY LOADING PARA REDUZIR BUNDLE SIZE ---

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthRedirect } from '@/components/AuthRedirect';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppRoute } from '@/components/AppRoute';
import { AdminRoute } from '@/components/AdminRoute';

import { AppLayout } from '@/components/AppLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

// Lazy loading para reduzir bundle inicial - páginas carregadas sob demanda
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Transacoes = lazy(() => import('@/pages/Transacoes'));
const Membros = lazy(() => import('@/pages/Membros'));
const Contribuicoes = lazy(() => import('@/pages/Contribuicoes'));
const Integracoes = lazy(() => import('@/pages/Integracoes'));
const Importacao = lazy(() => import('@/pages/Importacao'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const Admin = lazy(() => import('@/pages/Admin'));
const GerenciarUsuarios = lazy(() => import('@/pages/admin/GerenciarUsuarios'));
const GerenciarIgreja = lazy(() => import('@/pages/admin/GerenciarIgreja'));
const GerenciarCategorias = lazy(() => import('@/pages/admin/GerenciarCategorias'));
const GerenciarDados = lazy(() => import('@/pages/admin/GerenciarDados'));
const ConfiguracoesSistema = lazy(() => import('@/pages/admin/ConfiguracoesSistema'));
const CreateChurchPage = lazy(() => import('@/pages/CreateChurch'));
const ChurchConfirmation = lazy(() => import('@/pages/ChurchConfirmation'));
const SelectChurch = lazy(() => import('@/pages/SelectChurch'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const MinisterioInfantil = lazy(() => import('@/pages/MinisterioInfantil'));
const Escalas = lazy(() => import('@/pages/Escalas'));
const AceitarTermoVoluntario = lazy(() => import('@/pages/AceitarTermoVoluntario'));
const Eventos = lazy(() => import('@/pages/Eventos'));
const EventRegistrationPage = lazy(() => import('@/pages/EventRegistration'));

// Portal do Membro (unified)
const PortalAuth = lazy(() => import('@/pages/portal/PortalAuth'));
const PortalDashboard = lazy(() => import('@/pages/portal/PortalDashboard'));
const PortalSchedules = lazy(() => import('@/pages/portal/PortalSchedules'));
const PortalAnnouncements = lazy(() => import('@/pages/portal/PortalAnnouncements'));
const PortalChildren = lazy(() => import('@/pages/portal/PortalChildren'));
const PortalProfile = lazy(() => import('@/pages/portal/PortalProfile'));
const PortalEvents = lazy(() => import('@/pages/portal/PortalEvents'));
const PortalContributions = lazy(() => import('@/pages/portal/PortalContributions'));
const PortalLiveService = lazy(() => import('@/pages/portal/PortalLiveService'));
const PortalBooking = lazy(() => import('@/pages/portal/PortalBooking'));
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useChurchTheme } from '@/hooks/useChurchTheme';

function ChurchThemeProvider({ children }: { children: React.ReactNode }) {
  useChurchTheme();
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <AuthProvider>
            <ChurchThemeProvider>
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><LoadingSpinner size="lg" /></div>}>
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/faq" element={<FAQPage />} />

                  {/* Rota raiz: redireciona dependendo do auth */}
                  <Route path="/" element={<AuthRedirect />} />

                  {/* Rotas protegidas com layout (sidebar + header) */}
                  <Route path="/app/dashboard" element={<ProtectedRoute><AppRoute><AppLayout><Dashboard /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/transacoes" element={<ProtectedRoute><AppRoute><AppLayout><Transacoes /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/membros" element={<ProtectedRoute><AppRoute><AppLayout><Membros /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/contribuicoes" element={<ProtectedRoute><AppRoute><AppLayout><Contribuicoes /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/importacao" element={<ProtectedRoute><AppRoute><AppLayout><Importacao /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/integracoes" element={<ProtectedRoute><AppRoute><AppLayout><Integracoes /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/relatorios" element={<ProtectedRoute><AppRoute><AppLayout><Relatorios /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><Admin /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/usuarios" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><GerenciarUsuarios /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/ministerios" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><GerenciarIgreja /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/igreja" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><GerenciarIgreja /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/categorias" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><GerenciarCategorias /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/dados" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><GerenciarDados /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/admin/configuracoes-sistema" element={<ProtectedRoute><AppRoute><AdminRoute><AppLayout><ConfiguracoesSistema /></AppLayout></AdminRoute></AppRoute></ProtectedRoute>} />
                  <Route path="/app/configuracoes" element={<ProtectedRoute><AppRoute><AppLayout><Configuracoes /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/ministerio-infantil" element={<ProtectedRoute><AppRoute><AppLayout><MinisterioInfantil /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/escalas" element={<ProtectedRoute><AppRoute><Escalas /></AppRoute></ProtectedRoute>} />
                  <Route path="/app/eventos" element={<ProtectedRoute><AppRoute><AppLayout><Eventos /></AppLayout></AppRoute></ProtectedRoute>} />
                  <Route path="/app/voluntario/aceitar-termo" element={<ProtectedRoute><AppRoute><AceitarTermoVoluntario /></AppRoute></ProtectedRoute>} />
                  <Route path="/inscricao/:eventId" element={<EventRegistrationPage />} />
                  <Route path="/app/*" element={<ProtectedRoute><AppRoute><AppLayout><NotFound /></AppLayout></AppRoute></ProtectedRoute>} />

                  {/* Rotas de fluxo de criação/seleção (fora do layout principal) */}
                  <Route path="/create-church" element={<ProtectedRoute><CreateChurchPage /></ProtectedRoute>} />
                  <Route path="/church-confirmation" element={<ProtectedRoute><ChurchConfirmation /></ProtectedRoute>} />
                  <Route path="/select-church" element={<ProtectedRoute><SelectChurch /></ProtectedRoute>} />

                  {/* Portal do Membro (unified) */}
                  <Route path="/portal/auth" element={<PortalAuth />} />
                  <Route path="/portal" element={<ProtectedRoute><PortalLayout><PortalDashboard /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/escalas" element={<ProtectedRoute><PortalLayout><PortalSchedules /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/comunicados" element={<ProtectedRoute><PortalLayout><PortalAnnouncements /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/filhos" element={<ProtectedRoute><PortalLayout><PortalChildren /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/perfil" element={<ProtectedRoute><PortalLayout><PortalProfile /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/eventos" element={<ProtectedRoute><PortalLayout><PortalEvents /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/contribuicoes" element={<ProtectedRoute><PortalLayout><PortalContributions /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/culto-ao-vivo" element={<ProtectedRoute><PortalLayout><PortalLiveService /></PortalLayout></ProtectedRoute>} />
                  <Route path="/portal/agendar" element={<ProtectedRoute><PortalLayout><PortalBooking /></PortalLayout></ProtectedRoute>} />

                  {/* Fallback global */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ChurchThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
