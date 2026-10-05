import { Navigate, useParams } from 'react-router-dom';

/** Gli album non hanno più una pagina propria: i vecchi link portano alla galleria, sull'album giusto. */
export default function GalleryAlbumPage() {
  const { id } = useParams();
  return <Navigate to={`/galleria#${id ?? ''}`} replace />;
}
