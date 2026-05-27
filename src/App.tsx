import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AppLayout } from "@/components/AppLayout";
import { BranchProvider } from "@/contexts/BranchContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

// SUPERADMIN pages
import SADashboard from "./pages/superadmin/Dashboard";
import SACompanies from "./pages/superadmin/Companies";
import SAManagers from "./pages/superadmin/Managers";
import SAProfile from "./pages/superadmin/Profile";

// MANAGER pages
import MDashboard from "./pages/manager/Dashboard";
import MStaff from "./pages/manager/Staff";
import MProducts from "./pages/manager/Products";
import MOrders from "./pages/manager/Orders";
import MProfile from "./pages/manager/Profile";
import MRooms from "./pages/manager/ManagerRooms";
import Finance from "./pages/manager/Finance";
import SalesReport from "./pages/manager/SalesReport";


const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <SettingsProvider>
                <Toaster />
                <Sonner />
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />

                            {/* SUPERADMIN routes */}
                            <Route
                                path="/superadmin"
                                element={<AppLayout requiredRole="SUPERADMIN" />}
                            >
                                <Route index element={<SADashboard />} />
                                <Route path="companies" element={<SACompanies />} />
                                <Route path="managers" element={<SAManagers />} />
                                <Route path="profile" element={<SAProfile />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            {/* MANAGER routes */}
                            <Route
                                path="/manager"
                                element={<BranchProvider><AppLayout requiredRole="MANAGER" /></BranchProvider>}
                            >
                                <Route index element={<MDashboard />} />
                                <Route path="staff" element={<MStaff />} />
                                <Route path="products" element={<MProducts />} />
                                <Route path="orders" element={<MOrders />} />
                                <Route path="rooms" element={<MRooms />} />
                                <Route path="finance" element={<Finance />} />
                                <Route path="sales" element={<SalesReport />} />
                                <Route path="profile" element={<MProfile />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </SettingsProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
