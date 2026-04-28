import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import PersonalverwaltungPage from '@/pages/PersonalverwaltungPage';
import BereitschaftsdienstPage from '@/pages/BereitschaftsdienstPage';
import EinsatzprotokollPage from '@/pages/EinsatzprotokollPage';
import PublicFormPersonalverwaltung from '@/pages/public/PublicForm_Personalverwaltung';
import PublicFormBereitschaftsdienst from '@/pages/public/PublicForm_Bereitschaftsdienst';
import PublicFormEinsatzprotokoll from '@/pages/public/PublicForm_Einsatzprotokoll';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/689cb529a2bd8ef1df5d53da" element={<PublicFormPersonalverwaltung />} />
              <Route path="public/689cb52e3211bd59ce8f6461" element={<PublicFormBereitschaftsdienst />} />
              <Route path="public/689cb52fac1e6b256fa808a2" element={<PublicFormEinsatzprotokoll />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="personalverwaltung" element={<PersonalverwaltungPage />} />
                <Route path="bereitschaftsdienst" element={<BereitschaftsdienstPage />} />
                <Route path="einsatzprotokoll" element={<EinsatzprotokollPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
              {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
