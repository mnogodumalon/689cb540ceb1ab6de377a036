import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import PersonalverwaltungPage from '@/pages/PersonalverwaltungPage';
import BereitschaftsdienstPage from '@/pages/BereitschaftsdienstPage';
import EinsatzprotokollPage from '@/pages/EinsatzprotokollPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="personalverwaltung" element={<PersonalverwaltungPage />} />
          <Route path="bereitschaftsdienst" element={<BereitschaftsdienstPage />} />
          <Route path="einsatzprotokoll" element={<EinsatzprotokollPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}