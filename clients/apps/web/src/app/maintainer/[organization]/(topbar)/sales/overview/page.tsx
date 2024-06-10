import { getServerSideAPI } from '@/utils/api/serverside'
import { toISODate } from '@/utils/metrics'
import {
  Interval,
  MetricPeriod,
  Platforms,
  ProductPriceType,
} from '@polar-sh/sdk'
import {
  addDays,
  endOfMonth,
  max,
  min,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { RedirectType, redirect } from 'next/navigation'
import ClientPage from './ClientPage'

export default async function Page({
  params,
  searchParams,
}: {
  params: { organization: string }
  searchParams: {
    start_date?: string
    end_date?: string
    interval?: Interval
    product_id?: string
    product_price_type?: ProductPriceType
    focus?: keyof Omit<MetricPeriod, 'timestamp'>
  }
}) {
  const api = getServerSideAPI()
  const organization = await api.organizations.lookup({
    organizationName: params.organization,
    platform: Platforms.GITHUB,
  })

  const defaultInterval = Interval.MONTH
  const today = new Date()
  const defaultStartDate = subMonths(startOfMonth(today), 3)
  const defaultEndDate = endOfMonth(today)

  const interval = searchParams.interval || defaultInterval
  const startDate = searchParams.start_date
    ? new Date(searchParams.start_date)
    : defaultStartDate
  const endDate = searchParams.end_date
    ? new Date(searchParams.end_date)
    : defaultEndDate

  const limits = await api.metrics.getMetricsLimits()
  const minDate = new Date(limits.min_date)
  const maxDate = addDays(startDate, limits.intervals[interval].max_days)

  if (startDate < minDate || endDate > maxDate) {
    const urlSearchParams = new URLSearchParams({
      ...searchParams,
      start_date: toISODate(max([minDate, startDate])),
      end_date: toISODate(min([endDate, maxDate])),
    })
    redirect(
      `/maintainer/${organization.name}/sales/overview?${urlSearchParams}`,
      RedirectType.replace,
    )
  }

  const focus = searchParams.focus || 'revenue'

  return (
    <ClientPage
      organization={organization}
      limits={limits}
      startDate={startDate}
      endDate={endDate}
      interval={interval}
      productId={searchParams.product_id}
      productPriceType={searchParams.product_price_type}
      focus={focus}
    />
  )
}
