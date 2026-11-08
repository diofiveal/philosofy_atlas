import type {Metadata} from 'next';
import Atlas from '@/components/Atlas';

export const metadata: Metadata = {
  title: 'Платон — личное знакомство | Атлас философии',
  description: 'Пять глав жизни Платона, миф о пещере, теория идей, книги и интерактивные разговоры о справедливости и красоте.',
};

export default function PlatoRoute() {
  return <Atlas initialPhilosopherId="plato"/>;
}
