import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, User as UserIcon } from 'lucide-react';

type AppRole = 'admin' | 'user';

interface UserWithRole {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
}

export function RoleManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email');

      if (usersError) throw usersError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(
        rolesData?.map(r => [r.user_id, r.role as AppRole]) || []
      );

      return usersData?.map(user => ({
        ...user,
        role: rolesMap.get(user.id) || null,
      })) as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Verificar se já existe um role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Atualizar role existente
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole, assigned_by: currentUser.user?.id })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Inserir novo role
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: newRole,
            assigned_by: currentUser.user?.id 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar role');
    },
  });

  if (isLoading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gerenciamento de Roles
        </CardTitle>
        <CardDescription>
          Atribua permissões de administrador ou usuário para cada membro da equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{user.name || 'Sem nome'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Admin' : 'Usuário'}
                </Badge>

                <Select
                  value={user.role || 'user'}
                  onValueChange={(value) =>
                    updateRoleMutation.mutate({ userId: user.id, newRole: value as AppRole })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
