import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter,
  ClipboardList,
  Wrench
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FichaTecnicaDialog = ({ product }: { product: any }) => {
    // Busca os materiais
    const { data: materials } = useQuery({
        queryKey: ["materials"],
        queryFn: async () => {
            const { data, error } = await supabase.from("materials").select("*");
            if (error) throw new Error(error.message);
            return data;
        },
    });

    // Busca a ficha técnica (bill of materials) para este produto específico
    const { data: bom, isLoading: isLoadingBom } = useQuery({
        queryKey: ["bill_of_materials", product.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("bill_of_materials")
                .select(`
                    *,
                    materials (name, unit)
                `)
                .eq("product_id", product.id);
            if (error) throw new Error(error.message);
            return data;
        }
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Ver/Editar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Ficha Técnica: {product.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Materiais</Label>
                        <div className="p-4 border rounded-lg space-y-2 min-h-[100px]">
                            {isLoadingBom ? <p>Carregando...</p> : 
                                bom && bom.length > 0 ? bom.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <p className="text-sm">{item.materials?.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" defaultValue={item.quantity_required} className="w-24 h-8" />
                                            <span className="text-sm text-muted-foreground">{item.materials?.unit}</span>
                                            <Button variant="destructive" size="sm">Remover</Button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>
                            }
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Adicionar Material</Label>
                        <div className="flex gap-2">
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option disabled selected>Selecione um material</option>
                                {materials?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <Input type="number" placeholder="Qtd" className="w-24" />
                            <Button>Adicionar</Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="secondary">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="submit">Salvar Ficha Técnica</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const Produtos = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("products")
            .select(`
                *,
                bill_of_materials (count)
            `);
        if (error) throw new Error(error.message);
        return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">
              Cadastre produtos e gerencie suas fichas técnicas.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Catálogo de Produtos</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar produtos..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Custo Base</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead>Ficha Técnica</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                )) : products?.map((product) => {
                    const materials_count = product.bill_of_materials[0]?.count || 0;
                    return (
                        <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">R$ {(product.base_cost || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">R$ {product.sale_price.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={materials_count > 0 ? "default" : "secondary"}>
                                {materials_count} materiais
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <FichaTecnicaDialog product={product} />
                                    <Button variant="ghost" size="sm">
                                        <Wrench className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Produtos;

