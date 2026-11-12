/**
 * Formats a money amount for display. The platform sells in Moroccan dirhams
 * only, so the currency defaults to MAD and is rendered as a suffix:
 *   formatMAD(1234)        -> "1 234.00 MAD"
 *   formatMAD(9.5, 'EUR')  -> "9.50 EUR"
 * Non-numeric / missing amounts render as 0.00.
 */
export const formatMAD = (amount: number | string | null | undefined, currency: string = 'MAD'): string => {
  const n = typeof amount === 'number' ? amount : Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${value < 0 ? '-' : ''}${grouped}.${dec} ${currency || 'MAD'}`;
};

export default formatMAD;
