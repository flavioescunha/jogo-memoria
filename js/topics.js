import { CARDS_PORCENTAGEM } from './cards-porcentagem.js';
import { CARDS_MMC_MDC } from './cards-mmc-mdc.js';

export const TOPICS = [
  {
    id: 'porcentagem',
    title: 'Porcentagem, Aumento & Desconto Percentual',
    description: 'Revisão de porcentagem, conversão para decimal, fatores de aumento e desconto e aumentos sucessivos.',
    pairsPerRound: 8,
    cards: CARDS_PORCENTAGEM
  },
  {
    id: 'mmc-mdc',
    title: 'MMC e MDC',
    description: 'Múltiplos, divisores, divisibilidade, números primos, MMC e MDC com exemplos e aplicações.',
    pairsPerRound: 8,
    cards: CARDS_MMC_MDC
  }
];
