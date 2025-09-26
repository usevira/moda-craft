import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Settings,
  BarChart3
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
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Produção", url: "/producao", icon: Factory },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const managementItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all ${
      isActive 
        ? "bg-primary text-primary-foreground font-medium" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

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
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClassName}>
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
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
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName}>
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}