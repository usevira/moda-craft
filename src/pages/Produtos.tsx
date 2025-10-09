import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter,
  Trash2,
  ListPlus,
  Edit
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AddProductDialog } from "@/components/forms/AddProductForm";


const Produtos = () => {
    const queryClient = useQueryClient();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch products
    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const { data, error } = await (supabase as any).from("products").select("*");
            if (error) throw error;
            return data;
        },
    });

    // Fetch bill of materials for the selected product
    const { data: billOfMaterials, isLoading: isLoadingBOM } = useQuery({
        queryKey: ["billOfMaterials", selectedProduct?.id],
        queryFn: async () => {
            if (!selectedProduct) return [];
            const { data, error } = await (supabase as any)
                .from("bill_of_materials")
                .select(`*, materials (*)`)
                .eq("product_id", selectedProduct.id);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedProduct,
    });

    // Fetch all materials for the dropdown
    const { data: materials, isLoading: isLoadingMaterials } = useQuery({
        queryKey: ["materials"],
        queryFn: async () => {
            const { data, error } = await supabase.from("materials").select("*");
            if (error) throw error;
            return data;
        },
    });

    // Mutation to add a material
    const addMaterialMutation = useMutation({
        mutationFn: async ({ productId, materialId, quantity }: { productId: string, materialId: string, quantity: number }) => {
            const { error } = await (supabase as any).from("bill_of_materials").insert([{ product_id: productId, material_id: materialId, quantity_required: quantity }]);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Material adicionado à ficha técnica." });
            queryClient.invalidateQueries({ queryKey: ["billOfMaterials", selectedProduct?.id] });
        },
        onError: (error) => {
             toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    // Mutation to remove a material
    const removeMaterialMutation = useMutation({
         mutationFn: async (bomId: string) => {
            const { error } = await (supabase as any).from("bill_of_materials").delete().eq("id", bomId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Material removido da ficha técnica." });
            queryClient.invalidateQueries({ queryKey: ["billOfMaterials", selectedProduct?.id] });
        },
        onError: (error) => {
             toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const handleOpenModal = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddMaterial = () => {
        if (selectedProduct && selectedMaterial && quantity > 0) {
            addMaterialMutation.mutate({ productId: selectedProduct.id, materialId: selectedMaterial, quantity });
            setSelectedMaterial(null);
            setQuantity(1);
        } else {
             toast({ title: "Atenção", description: "Selecione um material e defina a quantidade.", variant: "destructive" });
        }
    };
    
    if (isLoadingProducts) {
        return (
             <DashboardLayout>
                <div className="space-y-6 animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-96 bg-muted rounded-lg"></div>
                </div>
            </DashboardLayout>
        )
    }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seus produtos e suas fichas técnicas
            </p>
          </div>
          <AddProductDialog />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Produtos Cadastrados</CardTitle>
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
                  <TableHead>Estilo</TableHead>
                  <TableHead className="text-right">Custo Base</TableHead>
                  <TableHead className="text-right">Preço de Venda</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {product.style && (
                        <Badge variant="outline">{product.style}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">R$ {(product.base_cost ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">R$ {(product.sale_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Ver/Editar Ficha Técnica
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Ficha Técnica: {selectedProduct?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <h4 className="font-medium">Materiais Necessários</h4>
                    {isLoadingBOM ? <p>A carregar materiais...</p> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Quantidade</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billOfMaterials?.map((bom: any) => (
                                <TableRow key={bom.id}>
                                    <TableCell>{bom.materials?.name}</TableCell>
                                    <TableCell>{bom.quantity_required}</TableCell>
                                    <TableCell>{bom.materials?.unit}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. Isto irá remover permanentemente o material da ficha técnica.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removeMaterialMutation.mutate(bom.id)}>
                                                        Remover
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium flex items-center gap-2"><ListPlus className="w-4 h-4" /> Adicionar Material</h4>
                         <div className="flex items-end gap-2">
                             <div className="flex-1">
                                <Label>Material</Label>
                                 <Select onValueChange={setSelectedMaterial} value={selectedMaterial || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingMaterials ? <SelectItem value="loading" disabled>A carregar...</SelectItem> :
                                        materials?.map((material: any) => (
                                            <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Quantidade</Label>
                                <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-24" />
                            </div>
                            <Button onClick={handleAddMaterial} disabled={addMaterialMutation.isPending}>
                                {addMaterialMutation.isPending ? "A adicionar..." : "Adicionar"}
                            </Button>
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Produtos;

