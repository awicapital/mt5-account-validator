"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Como posso resetar minha senha?",
    answer: "Você pode redefinir sua senha acessando a página de login e clicando em 'Esqueci minha senha'. Siga as instruções enviadas por e-mail."
  },
  {
    question: "Como entro em contato com o suporte?",
    answer: "Você pode entrar em contato com nosso suporte pelo e-mail suporte@empresa.com ou pelo chat disponível no canto inferior direito da tela."
  },
  {
    question: "Posso usar minha conta em vários dispositivos?",
    answer: "Sim! Você pode acessar sua conta de qualquer dispositivo, desde que use suas credenciais corretamente."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim. Utilizamos criptografia avançada e seguimos práticas recomendadas de segurança para proteger todas as informações."
  }
];

export default function FaqPage() {
  return (
    <div className="bg-[#03182f] min-h-dvh py-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center space-x-2 text-white">
          <HelpCircle className="w-6 h-6 text-blue-400" />
          <span className="text-sm font-semibold tracking-wide uppercase text-blue-400">Suporte e Ajuda</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">Central de Ajuda</h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Encontre respostas rápidas para as dúvidas mais comuns sobre nossa plataforma.
        </p>
      </div>

      <Card className="bg-[#0a294d] border border-[#1f2c44] text-white shadow-xl max-w-3xl mx-auto">
        <CardContent className="p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-b border-[#1f2c44]">
                <AccordionTrigger className="text-left text-base font-medium text-white hover:text-blue-400 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground mt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}