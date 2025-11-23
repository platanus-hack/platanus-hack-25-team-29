import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bot, MessageSquare, PieChart, Send, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import * as motion from "framer-motion/client";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black text-slate-900 dark:text-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Image 
              src="/project-logo.png" 
              alt="Lucas Logo" 
              width={32} 
              height={32} 
              className="rounded-full"
            />
            <span className="text-xl font-bold tracking-tight">Lucas</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/chat">
              <Button>Comenzar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
          <div className="container px-4 sm:px-8 mx-auto relative z-10">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Tu contador personal con IA
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6 bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  Toma el control de tus finanzas con Lucas
                </h1>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Conecta tus cuentas bancarias, analiza tus gastos automáticamente y conversa con tu asistente financiero personal para tomar mejores decisiones.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/chat">
                    <Button size="lg" className="h-12 px-8 text-base rounded-full">
                      Hablar con Lucas <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full">
                      Ver características
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container px-4 sm:px-8 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Todo lo que necesitas para entender tu dinero</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Lucas combina la seguridad bancaria con la inteligencia artificial para darte insights que realmente importan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MessageSquare className="h-10 w-10 text-blue-500" />,
                  title: "Chat Inteligente",
                  description: "Pregunta lo que quieras sobre tus finanzas en lenguaje natural. Lucas entiende tus gastos y te da respuestas claras."
                },
                {
                  icon: <PieChart className="h-10 w-10 text-green-500" />,
                  title: "Análisis Automático",
                  description: "Tus transacciones se categorizan y analizan automáticamente para mostrarte en qué estás gastando realmente."
                },
                {
                  icon: <ShieldCheck className="h-10 w-10 text-purple-500" />,
                  title: "Conexión Segura",
                  description: "Integración bancaria segura vía Fintoc. Tus credenciales nunca son almacenadas y tienes control total."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Preview Section */}
        <section className="py-24 overflow-hidden">
          <div className="container px-4 sm:px-8 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-14 rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-2xl left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                    <div className="rounded-4xl overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800 relative">
                        {/* Mock Chat Interface */}
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
                          {/* Header */}
                          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center sticky top-0 z-10">
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">Asistente Financiero</span>
                          </div>

                          <div className="flex-1 p-2 space-y-6 overflow-hidden">
                            {/* Message 1: Assistant */}
                            <div className="flex w-full gap-2 justify-start">
                                <div className="shrink-0 flex flex-col pt-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-white border-gray-200 text-teal-600 dark:bg-slate-800 dark:border-slate-700 dark:text-teal-400">
                                        <Bot size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start max-w-[85%]">
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lucas</span>
                                    </div>
                                    <div className="relative px-3 py-3 text-xs leading-relaxed shadow-sm bg-white border border-gray-200 text-slate-900 rounded-2xl rounded-tl-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                                        Hola, soy Lucas. He analizado tus gastos de este mes. ¿Te gustaría saber en qué categoría gastaste más?
                                    </div>
                                </div>
                            </div>

                            {/* Message 2: User */}
                            <div className="flex w-full gap-2 flex-row-reverse justify-start">
                                <div className="shrink-0 flex flex-col pt-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-[#5CB1A9] border-[#4a9c94] text-white">
                                        <User size={16} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end max-w-[85%]">
                                     <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tú</span>
                                    </div>
                                    <div className="relative px-3 py-3 text-xs leading-relaxed shadow-sm bg-[#e0f5f3] border border-[#bce3de] text-slate-800 rounded-2xl rounded-tr-sm dark:bg-teal-900/30 dark:border-teal-800 dark:text-slate-100">
                                        Sí, por favor. Y compáralo con el mes pasado.
                                    </div>
                                </div>
                            </div>

                            {/* Message 3: Assistant */}
                            <div className="flex w-full gap-2 justify-start">
                                <div className="shrink-0 flex flex-col pt-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-white border-gray-200 text-teal-600 dark:bg-slate-800 dark:border-slate-700 dark:text-teal-400">
                                        <Bot size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start max-w-[85%]">
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lucas</span>
                                    </div>
                                    <div className="relative px-3 py-3 text-xs leading-relaxed shadow-sm bg-white border border-gray-200 text-slate-900 rounded-2xl rounded-tl-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                                        Este mes gastaste <span className="font-bold text-red-500">$450.000</span> en Comida, un <span className="font-bold">15% más</span> que el mes anterior. ¿Quieres que establezcamos un presupuesto?
                                    </div>
                                </div>
                            </div>
                          </div>

                          {/* Input Area */}
                          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                             <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[24px] p-1.5 shadow-sm">
                                <div className="flex-1 h-8 bg-transparent text-xs flex items-center px-3 text-slate-400">Escribe tu mensaje...</div>
                                <div className="p-1.5 bg-teal-600 text-white rounded-full">
                                    <Send size={12} />
                                </div>
                             </div>
                          </div>
                        </div>
                    </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Insights en tiempo real
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                  Tu dinero, explicado simple
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Olvídate de las planillas de excel complejas. Lucas transforma los datos crudos de tu banco en conversaciones significativas y gráficos fáciles de entender.
                </p>
                <ul className="space-y-4">
                  {[
                    "Conexión instantánea con bancos chilenos",
                    "Detección de gastos hormiga y suscripciones",
                    "Alertas de gastos inusuales",
                    "Consejos personalizados de ahorro"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Link href="/chat">
                    <Button size="lg" variant="default" className="rounded-full px-8">
                      Probar Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
           <div className="container px-4 sm:px-8 mx-auto relative z-10 text-center">
             <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
               ¿Listo para ordenar tus finanzas?
             </h2>
             <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
               Únete a Lucas hoy y descubre una nueva forma de interactuar con tu dinero. Sin complicaciones, directo al grano.
             </p>
             <Link href="/chat">
               <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full">
                 Comenzar ahora
               </Button>
             </Link>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container px-4 sm:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded p-1 w-8 h-8 flex items-center justify-center">
              L
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Lucas</span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 Platanus Hack - Team 29. All rights reserved.
          </div>
          <div className="flex gap-4">
             {/* Social or additional links could go here */}
          </div>
        </div>
      </footer>
    </div>
  );
}
