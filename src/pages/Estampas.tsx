import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Palette, Search, Edit, Trash2, Image as ImageIcon, LayoutGrid, List, Filter } from 'lucide-react';
import { AddStampModal } from '@/components/stamps/AddStampModal';
import { EditStampModal } from '@/components/stamps/EditStampModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Estampas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStamp, setEditingStamp] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const queryClient = useQueryClient();

  const { data: stamps, isLoading } = useQuery({
    queryKey: ['stamps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stamps')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stamps').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estampa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['stamps'] });
    },
    onError: (error) => {
      toast.error('Erro ao excluir estampa: ' + error.message);
    },
  });

  // Obter categorias únicas
  const categories = useMemo(() => {
    if (!stamps) return [];
    const cats = [...new Set(stamps.map(s => s.category).filter(Boolean))];
    return cats.sort();
  }, [stamps]);

  const filteredStamps = useMemo(() => {
    if (!stamps) return [];
    
    return stamps.filter((s) => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stamps, searchTerm, selectedCategory, statusFilter]);

  const activeStamps = stamps?.filter((s) => s.is_active).length || 0;
  const totalStamps = stamps?.length || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Cadastro de Estampas</h1>
            <p className="text-muted-foreground">
              Gerencie as estampas disponíveis para produtos
            </p>
          </div>
          <AddStampModal />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Estampas</p>
                  <p className="text-2xl font-bold">{totalStamps}</p>
                </div>
                <Palette className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estampas Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{activeStamps}</p>
                </div>
                <Palette className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inativas</p>
                  <p className="text-2xl font-bold text-muted-foreground">{totalStamps - activeStamps}</p>
                </div>
                <Palette className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Filter className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Galeria de Estampas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat as string}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              Mostrando {filteredStamps.length} de {totalStamps} estampas
            </p>

            {!filteredStamps?.length ? (
              <div className="text-center py-12">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma estampa encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente ajustar os filtros ou adicione uma nova estampa
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredStamps.map((stamp) => (
                  <Card key={stamp.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-muted">
                      {stamp.image_url ? (
                        <img
                          src={stamp.image_url}
                          alt={stamp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingStamp(stamp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Estampa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a estampa "{stamp.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(stamp.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        {stamp.is_active ? (
                          <Badge className="bg-green-600 text-white">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold truncate" title={stamp.name}>
                        {stamp.name}
                      </h3>
                      {stamp.code && (
                        <p className="text-xs text-muted-foreground">
                          Código: {stamp.code}
                        </p>
                      )}
                      {stamp.category && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {stamp.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Table View */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStamps.map((stamp) => (
                    <TableRow key={stamp.id}>
                      <TableCell>
                        {stamp.image_url ? (
                          <img
                            src={stamp.image_url}
                            alt={stamp.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{stamp.name}</TableCell>
                      <TableCell>{stamp.code || '-'}</TableCell>
                      <TableCell>{stamp.category || '-'}</TableCell>
                      <TableCell>
                        {stamp.is_active ? (
                          <Badge className="bg-green-600">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStamp(stamp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Estampa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a estampa "{stamp.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(stamp.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {editingStamp && (
          <EditStampModal
            stamp={editingStamp}
            open={!!editingStamp}
            onOpenChange={(open) => !open && setEditingStamp(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Estampas;
