"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { resetTeacherPasswordAction } from "@/app/admin/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetTeacherPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  teacherName: string;
};

export function ResetTeacherPasswordDialog({
  open,
  onOpenChange,
  profileId,
  teacherName,
}: ResetTeacherPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Contraseña corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "No coinciden",
        description: "La contraseña y la confirmación deben ser iguales.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await resetTeacherPasswordAction(profileId, password);
      toast({
        title: "Contraseña actualizada",
        description: `Se restableció la contraseña de ${teacherName}.`,
      });
      onOpenChange(false);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo restablecer la contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="reset-teacher-password-desc">
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription id="reset-teacher-password-desc">
            Nueva contraseña para <strong>{teacherName}</strong> (mínimo 6 caracteres). El profesor
            podrá iniciar sesión con su email y esta contraseña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password-teacher">Nueva contraseña</Label>
            <Input
              id="new-password-teacher"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password-teacher">Confirmar contraseña</Label>
            <Input
              id="confirm-password-teacher"
              type="password"
              placeholder="Repetí la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Restablecer contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
