/**
 * Type shim for apexcharts v5.x
 * apexcharts v5 uses `export = ApexCharts` (namespace pattern), not named exports.
 * This shim re-exports ApexOptions as a named export so existing imports work.
 */
declare module 'apexcharts' {
  // Minimal ApexOptions shape — enough for type safety without full apexcharts types
  export interface ApexOptions {
    chart?: {
      type?: string;
      height?: number | string;
      width?: number | string;
      toolbar?: { show?: boolean; [key: string]: any };
      zoom?: { enabled?: boolean; [key: string]: any };
      background?: string;
      [key: string]: any;
    };
    colors?: string[];
    dataLabels?: { enabled?: boolean; [key: string]: any };
    stroke?: { curve?: string; width?: number; [key: string]: any };
    fill?: { type?: string; gradient?: any; [key: string]: any };
    xaxis?: { categories?: any[]; labels?: any; [key: string]: any };
    yaxis?: {
      labels?: {
        formatter?: (val: number, opts?: any) => string;
        style?: any;
        [key: string]: any;
      };
      [key: string]: any;
    };
    tooltip?: {
      y?: {
        formatter?: (val: number, opts?: any) => string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    grid?: { borderColor?: string; strokeDashArray?: number; [key: string]: any };
    series?: any[];
    legend?: any;
    plotOptions?: any;
    markers?: any;
    [key: string]: any;
  }

  const ApexCharts: any;
  export default ApexCharts;
}
