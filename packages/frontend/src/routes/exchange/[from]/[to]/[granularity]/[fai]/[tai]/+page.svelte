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

  import type { Client, Granularity, OrderBook } from '@ofleps/client';
  import SelectInput from '$lib/components/SelectInput.svelte';

  export let data;

  import { getContext, onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import { dateToUtc, trigger_error } from '$lib';

  import OrderBookComponent from '$lib/components/OrderBook.svelte';
  import BuySell from '$lib/components/BuySell.svelte';

  import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';

  const toastStore = getToastStore();

  const user: Writable<Client> = getContext('user');
  let chart: IChartApi | null;

  let candleData: Writable<CandlestickData<Time>[]> = writable();
  let histogramData: Writable<HistogramData<Time>[]> = writable();
  let baselineData: Writable<BaselineData<Time>[]> = writable();

  let orderBook: OrderBook = data.orderBook;
  let granularities: Granularity[] = data.granularities;
  let price: string = data.price;
  let quantity: string = '0';
  let granularityValue: string = data.granularity;

  let type: 'line' | 'candle' = 'line';

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

    localization: {
      timeFormatter: (time: UTCTimestamp) => {
        const date = new Date(time * 1000).toLocaleString();
        return date;
      },
    },
  };

  async function updateInfo() {
    const tradingSchedule = await $user.getTradingSchedule(
      data.from,
      data.to,
      granularityValue
    );

    orderBook = await $user.getOrderBook(data.from, data.to);

    histogramData.set(
      tradingSchedule.map(({ dateStart, volume, open, close }) => {
        return {
          time: dateToUtc(dateStart) as UTCTimestamp,
          value: volume,
          color: open < close ? '#26a69a' : '#ef5350',
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

  async function onBuy() {
    try {
      const order = await $user.buy(
        data.fromAccountId,
        data.toAccountId,
        data.from,
        data.to,
        parseFloat(quantity),
        parseFloat(price)
      );

      triggerSuccess(`Order ${order.id} created`);
      await updateInfo();
    } catch (e: any) {
      trigger_error(toastStore, e);
    }
  }
  async function onSell() {
    try {
      const order = await $user.sell(
        data.fromAccountId,
        data.toAccountId,
        data.from,
        data.to,
        parseFloat(quantity),
        parseFloat(price)
      );

      triggerSuccess(`Order ${order.id} created`);
      await updateInfo();
    } catch (e: any) {
      trigger_error(toastStore, e);
    }
  }

  function triggerSuccess(message: string) {
    const t: ToastSettings = {
      message: message,
      background: 'variant-filled-success',
    };
    toastStore.trigger(t);
  }

  async function updatePage() {
    await updateInfo();
    chart!.timeScale().fitContent();
    goto(
      `/exchange/${data.from}/${data.to}/${granularityValue}/${data.fromAccountId}/${data.toAccountId}`
    );
  }

  onMount(() => {
    updateInfo().then(() => {
      chart!.timeScale().fitContent();
    });

    $user.getGranularities().then((g) => {
      granularities = g;
    });

    const interval = setInterval(updateInfo, 5000);
    return () => clearInterval(interval);
  });
</script>

<div class="p-5">
  <div class="flex gap-5 justify-between items-center m-2">
    <h1 class="pb-5 text-2xl font-bold">
      {data.from}/{data.to}
    </h1>
  </div>
  <div class="grid xl:grid-cols-6 grid-cols-1">
    <div class="col-span-5 rounded-xl">
      <Chart
        autoSize
        height={600}
        container={{ class: 'chart-container' }}
        ref={(ref) => (chart = ref)}
        {...options}
      >
        {#if type === 'candle'}
          <CandlestickSeries data={$candleData} reactive />
        {:else}
          <BaselineSeries data={$baselineData} reactive />
        {/if}

        <HistogramSeries
          data={$histogramData}
          priceScaleId="volume"
          color="#26a69a"
          priceFormat={{ type: 'volume' }}
          reactive
        />

        <PriceScale id="volume" scaleMargins={{ top: 0.9, bottom: 0 }} />
      </Chart>
    </div>

    <div class="col-span-1 flex flex-col gap-2">
      <div class="flex mx-5 gap-2">
        <SelectInput
          options={granularities.map((g) => ({
            title: g.granularity,
            value: g.granularity,
          }))}
          bind:value={granularityValue}
          className="grow"
          onChange={updatePage}
        />
        <SelectInput
          options={[
            {
              title: 'Line',
              value: 'line',
            },
            {
              title: 'Candle',
              value: 'candle',
            },
          ]}
          bind:value={type}
          className="grow"
        />
      </div>
      <BuySell
        from={data.from}
        to={data.to}
        {onBuy}
        {onSell}
        bind:price
        bind:quantity
      />
      <OrderBookComponent bids={orderBook.bids} asks={orderBook.asks} />
    </div>
  </div>
</div>

<style lang="postcss">
  :global(.chart-container) {
    @apply w-full h-full;
  }
</style>
