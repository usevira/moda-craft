import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Schema de validação
const productSchema = z.object({
  sku: z.string().min(1, { message: "SKU é obrigatório." }),
  name: z.string().min(1, { message: "Nome do produto é obrigatório." }),
  category: z.string().min(1, { message: "Categoria é obrigatória." }),
  base_cost: z.coerce.number().min(0, { message: "Custo deve ser positivo." }),
  sale_price: z.coerce.number().min(0, { message: "Preço deve ser positivo." }),
});

// Componente do formulário
export const AddProductForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            name: "",
            category: "",
            base_cost: 0,
            sale_price: 0,
        },
    });

    const addProductMutation = useMutation({
        mutationFn: async (newProduct: z.infer<typeof productSchema>) => {
            // O tenant_id agora é definido automaticamente pelo banco de dados
            // graças às RLS policies e ao DEFAULT get_my_tenant_id().
            const { data, error } = await (supabase as any)
                .from("products")
                .insert([newProduct])
                .select();
            
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto adicionado com sucesso." });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({ title: "Erro ao adicionar produto", description: error.message, variant: "destructive" });
        },
    });

    function onSubmit(values: z.infer<typeof productSchema>) {
        addProductMutation.mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                                <Input placeholder="CAM-001" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                                <Input placeholder="Camiseta Básica" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                                <Input placeholder="Vestuário" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="base_cost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custo Base (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="sale_price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preço de Venda (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={addProductMutation.isPending}>
                        {addProductMutation.isPending ? "A guardar..." : "Guardar Produto"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

// Componente que controla o Dialog
export const AddProductDialog = () => {
    const [open, setOpen] = useState(false);
    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Produto
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                </DialogHeader>
                <AddProductForm setOpen={setOpen} />
            </DialogContent>
        </Dialog>
    )
}

