import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, ArrowLeft, Eye, Download, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ButtonBeige } from "@/components/ui/button-beige";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData, fromSupabase } from "@/types/supportTickets";
import { DeleteApplicationButton } from "@/components/DeleteApplicationButton";

const AdminApplications = () => {
  // ... rest of the code remains the same until the table row for each application

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <ButtonBeige 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Dashboard
          </ButtonBeige>
          
          <h1 className="text-3xl font-bold text-beige mb-2">
            Anträge verwalten
          </h1>
          <p className="text-beige/70">
            Verwalten und prüfen Sie Tippgemeinschaft-Anträge.
          </p>
        </div>
        
        <div className="glass-beige p-8 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-beige/50" />
              <Input
                placeholder="Suche nach Name, E-Mail oder Telefonnummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/50"
              />
            </div>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-beige/70">
              Keine Anträge gefunden.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-beige">Name</TableHead>
                    <TableHead className="text-beige">E-Mail</TableHead>
                    <TableHead className="text-beige">Status</TableHead>
                    <TableHead className="text-beige">Datum</TableHead>
                    <TableHead className="text-beige">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium text-beige">
                        {app.first_name} {app.last_name}
                      </TableCell>
                      <TableCell className="text-beige">{app.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'freigegeben' 
                            ? 'bg-green-500/20 text-green-500' 
                            : app.status === 'korrektur_erforderlich'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-beige/20 text-beige'
                        }`}>
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-beige/70">
                        {new Date(app.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openViewDialog(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </ButtonBeige>
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openApproveDialog(app)}
                            disabled={app.status === 'freigegeben'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </ButtonBeige>
                          <ButtonBeige 
                            size="sm" 
                            variant="outline"
                            onClick={() => openRejectDialog(app)}
                            disabled={app.status === 'korrektur_erforderlich'}
                          >
                            <XCircle className="h-4 w-4" />
                          </ButtonBeige>
                          <DeleteApplicationButton 
                            applicationId={app.id}
                            userName={`${app.first_name} ${app.last_name}`}
                            onDelete={() => fetchApplications()}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      {/* Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* ... rest of the dialog code remains the same */}
      </Dialog>
    </div>
  );
};

export default AdminApplications;
