import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import PersonalverwaltungPage from '@/pages/PersonalverwaltungPage';
import BereitschaftsdienstPage from '@/pages/BereitschaftsdienstPage';
import EinsatzprotokollPage from '@/pages/EinsatzprotokollPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="personalverwaltung" element={<PersonalverwaltungPage />} />
              <Route path="bereitschaftsdienst" element={<BereitschaftsdienstPage />} />
              <Route path="einsatzprotokoll" element={<EinsatzprotokollPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
