import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Você pode mostrar um spinner de carregamento aqui
    return <div>Carregando...</div>;
  }

  if (!user) {
    // Redireciona para a página de login se não houver usuário
    return <Navigate to="/auth" />;
  }

  // Se o usuário estiver logado, renderiza o conteúdo da rota
  return <Outlet />;
};

