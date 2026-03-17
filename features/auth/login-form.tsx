"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signInSchema, type SignInInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        const profile = profileRow as { role: string } | null;

        const next = profile?.role === "admin" ? "/admin" : "/teacher";
        // Full page redirect para que el servidor reciba las cookies de sesión
        window.location.href = next;
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const error = searchParams.get("error");
  if (error === "auth") {
    toast({
      title: "Error de autenticación",
      description: "No se pudo completar el inicio de sesión.",
      variant: "destructive",
    });
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card">
      <CardHeader className="flex flex-col items-center text-center">
        <Image
          src="/full_logo.svg"
          alt="App Gym"
          width={220}
          height={66}
          className="mb-4 h-auto w-full max-w-[220px] shrink-0"
          priority
        />
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>App Gym - Gestión de horas de clases</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Volver al inicio
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
