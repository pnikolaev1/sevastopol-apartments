"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React from "react";
import { Loader2, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSubmitted(true);
      toast.success(t("form.success"));
    } else {
      toast.error(t("form.error"));
    }
  }

  const contacts: Array<{
    icon: React.ElementType;
    label: string;
    href: string;
    text: string;
    external?: boolean;
  }> = [
    { icon: Phone, label: t("phone"), href: "tel:+35989436230", text: "+359 89 436 2230" },
    { icon: MessageCircle, label: t("whatsapp"), href: "https://wa.me/35989436230", text: "WhatsApp", external: true },
    { icon: MessageCircle, label: t("viber"), href: "viber://chat?number=%2B35989436230", text: "Viber" },
    { icon: Mail, label: t("email"), href: "mailto:5areood@gmail.com", text: "5areood@gmail.com" },
    {
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      label: t("facebook"),
      href: "https://www.facebook.com/search/top?q=sevastopol%20apartments%20varna",
      text: "Facebook",
      external: true,
    },
  ];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">{t("title")}</h1>
            <p className="text-muted-foreground">{t("desc")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact methods */}
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, href, text, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:bg-muted/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{text}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Contact form */}
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <p className="text-emerald-600 font-semibold text-lg">{t("form.success")}</p>
                  </div>
                ) : (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t("form.name")}</Label>
                      <Input id="name" {...form.register("name")} />
                    </div>
                    <div>
                      <Label htmlFor="email">{t("form.email")}</Label>
                      <Input id="email" type="email" {...form.register("email")} />
                    </div>
                    <div>
                      <Label htmlFor="message">{t("form.message")}</Label>
                      <Textarea id="message" rows={4} {...form.register("message")} />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                      ) : t("form.send")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
