import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Атлас философии — искусство задавать вопросы', description: 'Интерактивный путеводитель по истории мысли. 24 философа, карта идей, хронология и вопросы, которые объединяют нас.' };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {return <html lang="ru" suppressHydrationWarning><body>{children}</body></html>;}
