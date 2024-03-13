<script lang="ts" async>
  import type {
    CandlestickData,
    HistogramData,
    BaselineData,
    Time,
    UTCTimestamp,
    IChartApi,
  } from 'lightweight-charts';

  import {
    Chart,
    CandlestickSeries,
    HistogramSeries,
    BaselineSeries,
  } from 'svelte-lightweight-charts';

  import type { Client } from 'ofleps-client';

  export let data;

  import { getContext, onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import { dateToUtc } from '$lib';

  const user: Writable<Client> = getContext('user');
  let chart: IChartApi | null;

  let candleData: Writable<CandlestickData<Time>[]> = writable();
  let histogramData: Writable<HistogramData<Time>[]> = writable();
  let baselineData: Writable<BaselineData<Time>[]> = writable();
  onMount(async () => {
    const tradingSchedule = await $user.getTradingSchedule(
      data.from,
      data.to,
      data.granularity
    );

    histogramData.set(
      tradingSchedule.map(({ dateStart, volume }) => {
        return {
          time: dateToUtc(dateStart) as UTCTimestamp,
          value: volume,
        };
      })
    );

    candleData.set(
      tradingSchedule.map(({ open, high, low, close, dateStart }) => {
        return {
          time: dateToUtc(dateStart) as UTCTimestamp,
          open,
          high,
          low,
          close,
        };
      })
    );

    baselineData.set(
      tradingSchedule.map(({ dateStart, close }) => {
        return {
          time: dateToUtc(dateStart) as UTCTimestamp,
          value: close,
        };
      })
    );

    chart!.timeScale().fitContent();
  });

  $: console.log($candleData);
</script>

<div>
  <h1>{data.from} to {data.to} by {data.granularity}</h1>
  <br />

  <div class="chart-container">
    <Chart
      autoSize
      container={{ class: 'chart-container' }}
      ref={(ref) => (chart = ref)}
    >
      <CandlestickSeries data={$candleData} reactive />
      <HistogramSeries data={$histogramData} reactive />
      <BaselineSeries data={$baselineData} reactive />
    </Chart>
  </div>
</div>

<style>
  :global(.chart-container) {
    aspect-ratio: 16 / 9;
    width: 80%;
    height: 80%;
    margin: auto;
  }
</style>
