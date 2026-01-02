import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, DollarSign, Eye, Receipt, Upload, FileText } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CommissionStatementsList() {
  const [selectedStatement, setSelectedStatement] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: statements, isLoading } = useQuery({
    queryKey: ['commission-statements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_statements')
        .select(`
          *,
          representative:customers!commission_statements_representative_id_fkey(id, name, contact)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_statements')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prestação fechada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['commission-statements'] });
    },
    onError: (error) => {
      toast.error('Erro ao fechar prestação: ' + error.message);
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ id, paymentDate, proofUrl }: { id: string; paymentDate: string; proofUrl?: string }) => {
      const { error } = await supabase
        .from('commission_statements')
        .update({
          status: 'paid',
          payment_date: paymentDate,
          payment_proof_url: proofUrl || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['commission-statements'] });
      setPaymentDialogOpen(false);
      setSelectedStatement(null);
      setProofFile(null);
    },
    onError: (error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><CheckCircle className="mr-1 h-3 w-3" />Fechada</Badge>;
      case 'paid':
        return <Badge className="bg-green-600"><DollarSign className="mr-1 h-3 w-3" />Pago</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleOpenPayment = (statement: any) => {
    setSelectedStatement(statement);
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Prestações de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!statements?.length ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma prestação de contas encontrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Representante</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Total Vendas</TableHead>
                  <TableHead>Comissão (40%)</TableHead>
                  <TableHead>Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((statement) => (
                  <TableRow key={statement.id}>
                    <TableCell className="font-medium">
                      {statement.representative?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(statement.period_start), 'dd/MM/yy', { locale: ptBR })} -{' '}
                      {format(new Date(statement.period_end), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{formatCurrency(statement.total_sales)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(statement.commission_amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(statement.net_amount)}</TableCell>
                    <TableCell>{getStatusBadge(statement.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {statement.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => closeMutation.mutate(statement.id)}
                            disabled={closeMutation.isPending}
                          >
                            Fechar
                          </Button>
                        )}
                        {statement.status === 'closed' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenPayment(statement)}
                          >
                            Pagar
                          </Button>
                        )}
                        {statement.payment_proof_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(statement.payment_proof_url, '_blank')}
                            title="Ver comprovante"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedStatement && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p><strong>Representante:</strong> {selectedStatement.representative?.name}</p>
                <p><strong>Valor a Pagar:</strong> {formatCurrency(selectedStatement.commission_amount)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Comprovante de Pagamento (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {proofFile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProofFile(null)}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {proofFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {proofFile.name}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  setUploading(true);
                  let proofUrl: string | undefined;
                  
                  if (proofFile) {
                    const fileExt = proofFile.name.split('.').pop();
                    const fileName = `${selectedStatement.id}-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('payment-proofs')
                      .upload(fileName, proofFile);
                    
                    if (uploadError) {
                      toast.error('Erro ao enviar comprovante: ' + uploadError.message);
                      setUploading(false);
                      return;
                    }
                    
                    const { data: { publicUrl } } = supabase.storage
                      .from('payment-proofs')
                      .getPublicUrl(fileName);
                    
                    proofUrl = publicUrl;
                  }
                  
                  payMutation.mutate({ id: selectedStatement.id, paymentDate, proofUrl });
                  setUploading(false);
                }}
                disabled={payMutation.isPending || uploading}
              >
                {uploading ? 'Enviando...' : payMutation.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
