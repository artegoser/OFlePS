<script lang="ts" async>
  import type {
    CandlestickData,
    HistogramData,
    BaselineData,
    Time,
    UTCTimestamp,
    IChartApi,
  } from 'lightweight-charts';

  import { ColorType } from 'lightweight-charts';

  import {
    Chart,
    CandlestickSeries,
    HistogramSeries,
    BaselineSeries,
    PriceScale,
  } from 'svelte-lightweight-charts';

  import type { Client } from '@ofleps/client';

  export let data;

  import { getContext, onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import { dateToUtc, type Order } from '$lib';

  import OrderBook from '$lib/components/OrderBook.svelte';
  import BuySell from '$lib/components/BuySell.svelte';

  const user: Writable<Client> = getContext('user');
  let chart: IChartApi | null;

  let candleData: Writable<CandlestickData<Time>[]> = writable();
  let histogramData: Writable<HistogramData<Time>[]> = writable();
  let baselineData: Writable<BaselineData<Time>[]> = writable();

  let orderBook: { bids: Order[]; asks: Order[] };

  const options = {
    layout: {
      background: {
        type: ColorType.Solid,
        color: '#15171f',
      },
      textColor: '#dfe0e2',
    },

    grid: {
      vertLines: {
        color: 'rgba(42, 46, 57, 0)',
      },
      horzLines: {
        color: 'rgba(42, 46, 57, 0.6)',
      },
    },
  };

  async function updateInfo() {
    const tradingSchedule = await $user.getTradingSchedule(
      data.from,
      data.to,
      data.granularity
    );

    orderBook = await $user.getOrderBook(data.from, data.to);

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
  }

  onMount(async () => {
    await updateInfo();

    chart!.timeScale().fitContent();

    setInterval(updateInfo, 5000);
  });
</script>

<div class="p-5">
  <h1 class="pb-5 text-2xl font-bold">
    {data.from}/{data.to}, {data.granularity}
  </h1>
  <div class="grid xl:grid-cols-6 grid-cols-1">
    <div class="col-span-5 rounded-xl">
      <Chart
        autoSize
        height={600}
        container={{ class: 'chart-container' }}
        ref={(ref) => (chart = ref)}
        {...options}
      >
        <CandlestickSeries data={$candleData} reactive />
        <HistogramSeries
          data={$histogramData}
          priceScaleId="volume"
          color="#26a69a"
          priceFormat={{ type: 'volume' }}
          reactive
        />
        <BaselineSeries data={$baselineData} reactive />
        <PriceScale id="volume" scaleMargins={{ top: 0.8, bottom: 0 }} />
      </Chart>
    </div>

    <div class="col-span-1 flex flex-col">
      <OrderBook bids={orderBook?.bids || []} asks={orderBook?.asks || []} />
      <BuySell />
    </div>
  </div>
</div>

<style lang="postcss">
  :global(.chart-container) {
    @apply w-full h-full;
  }
</style>
