import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import NewsList from './pages/public/NewsList';
import NewsDetail from './pages/public/NewsDetail';
import EventsList from './pages/public/EventsList';
import EventDetail from './pages/public/EventDetail';
import RegistrationPage from './pages/public/RegistrationPage';
import GalleryList from './pages/public/GalleryList';
import GalleryAlbumPage from './pages/public/GalleryAlbumPage';
import DocumentsPage from './pages/public/DocumentsPage';
import LegalPage from './pages/public/LegalPage';
import NotFound from './pages/public/NotFound';

const lazyPage = (loader: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await loader()).default,
});

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PublicLayout,
    children: [
      { index: true, Component: Home },
      { path: 'news', Component: NewsList },
      { path: 'news/:slug', Component: NewsDetail },
      { path: 'eventi', Component: EventsList },
      { path: 'eventi/:slug', Component: EventDetail },
      { path: 'eventi/:slug/iscrizione', Component: RegistrationPage },
      { path: 'galleria', Component: GalleryList },
      { path: 'galleria/:id', Component: GalleryAlbumPage },
      { path: 'documenti', Component: DocumentsPage },
      { path: 'privacy', element: <LegalPage kind="privacy" /> },
      { path: 'cookie-policy', element: <LegalPage kind="cookie" /> },
      { path: '*', Component: NotFound },
    ],
  },
  {
    path: '/admin',
    lazy: lazyPage(() => import('./pages/admin/AdminLayout')),
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/admin/Dashboard')) },
      { path: 'sito', lazy: lazyPage(() => import('./pages/admin/SiteEditor')) },
      { path: 'news', lazy: lazyPage(() => import('./pages/admin/NewsAdmin')) },
      { path: 'news/:id', lazy: lazyPage(() => import('./pages/admin/NewsEdit')) },
      { path: 'eventi', lazy: lazyPage(() => import('./pages/admin/EventsAdmin')) },
      { path: 'eventi/:id', lazy: lazyPage(() => import('./pages/admin/EventEdit')) },
      { path: 'staff', lazy: lazyPage(() => import('./pages/admin/StaffAdmin')) },
      { path: 'documenti', lazy: lazyPage(() => import('./pages/admin/DocumentsAdmin')) },
      { path: 'galleria', lazy: lazyPage(() => import('./pages/admin/GalleryAdmin')) },
      { path: 'galleria/:id', lazy: lazyPage(() => import('./pages/admin/GalleryEdit')) },
      { path: 'iscrizioni', lazy: lazyPage(() => import('./pages/admin/RegistrationsAdmin')) },
    ],
  },
]);
