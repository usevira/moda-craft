import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Settings,
  BarChart3,
  ClipboardList,
  Truck,
  Store,
  Building2,
  Calendar,
  Palette,
  FileSpreadsheet
} from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/produtos", icon: ClipboardList },
  { title: "Estampas", url: "/estampas", icon: Palette },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Produção", url: "/producao", icon: Factory },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Consignação", url: "/consignacao", icon: Truck },
  { title: "Eventos", url: "/eventos", icon: Calendar },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "DRE", url: "/relatorio-dre", icon: FileSpreadsheet },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const managementItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Lojas", url: "/lojas", icon: Building2 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const resellerItems = [
  { title: "Portal Revendedor", url: "/portal-revendedor", icon: Store },
];

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <Factory className="w-4 h-4 text-primary-foreground" />
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="text-lg font-semibold">Fashion ERP</h2>
              <p className="text-xs text-muted-foreground">Gestão Completa</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} end>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={state === 'collapsed' ? item.title : undefined}>
                        <item.icon className="w-4 h-4" />
                        {state === "expanded" && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                   <NavLink to={item.url} end>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={state === 'collapsed' ? item.title : undefined}>
                        <item.icon className="w-4 h-4" />
                        {state === "expanded" && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Revendedor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resellerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                   <NavLink to={item.url} end>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={state === 'collapsed' ? item.title : undefined}>
                        <item.icon className="w-4 h-4" />
                        {state === "expanded" && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

