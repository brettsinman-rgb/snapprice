import type { GarageVehicle, PriceAlert, VehiclePriceAlert } from '@prisma/client';
import { prisma } from '@/lib/db';
import { findLowestResult, runPriceAlertSearch } from '@/lib/price-alerts';

export type VehiclePriceAlertForCheck = VehiclePriceAlert & {
  garageVehicle: GarageVehicle;
  priceAlert: PriceAlert;
};

export type VehiclePriceAlertCheckResult = {
  alertId: string;
  status: 'checked' | 'triggered' | 'skipped' | 'failed';
  message: string;
  currentLowestPrice?: number | null;
};

export async function checkVehiclePriceAlert(
  vehiclePriceAlert: VehiclePriceAlertForCheck
): Promise<VehiclePriceAlertCheckResult> {
  const { priceAlert, garageVehicle } = vehiclePriceAlert;

  if (priceAlert.status !== 'active') {
    return {
      alertId: priceAlert.id,
      status: 'skipped',
      message: 'Only active Vehicle Hub alerts are checked.'
    };
  }

  const now = new Date();

  try {
    const results = await runPriceAlertSearch(priceAlert.searchQuery, priceAlert.manufacturer ?? garageVehicle.make);
    const lowest = findLowestResult(results);

    if (!lowest) {
      await prisma.priceAlert.update({
        where: { id: priceAlert.id },
        data: { lastCheckedAt: now }
      });

      return {
        alertId: priceAlert.id,
        status: 'checked',
        message: 'Checked successfully, but no priced marketplace result was available.',
        currentLowestPrice: null
      };
    }

    const hasTargetTrigger =
      priceAlert.targetPrice != null &&
      lowest.currency === priceAlert.currency &&
      lowest.price <= priceAlert.targetPrice;
    const hasNewLowestTrigger =
      priceAlert.targetPrice == null &&
      priceAlert.currentLowestPrice != null &&
      lowest.currency === priceAlert.currency &&
      lowest.price < priceAlert.currentLowestPrice;
    const shouldTrigger = hasTargetTrigger || hasNewLowestTrigger;
    const duplicateTrigger =
      shouldTrigger &&
      priceAlert.triggeredProductUrl === lowest.productUrl &&
      priceAlert.triggeredPrice === lowest.price &&
      priceAlert.notificationStatus === 'pending';

    await prisma.priceAlert.update({
      where: { id: priceAlert.id },
      data: {
        currentLowestPrice: lowest.price,
        currency: lowest.currency,
        lastCheckedAt: now,
        lastResultTitle: lowest.title,
        lastResultUrl: lowest.productUrl,
        lastResultPrice: lowest.price,
        lastResultImage: lowest.image,
        ...(shouldTrigger && !duplicateTrigger
          ? {
              status: 'triggered',
              triggeredAt: now,
              triggeredPrice: lowest.price,
              triggeredProductTitle: lowest.title,
              triggeredProductUrl: lowest.productUrl,
              triggeredProductImage: lowest.image,
              notificationType: 'in_app',
              notificationStatus: 'pending'
            }
          : {})
      }
    });

    return {
      alertId: priceAlert.id,
      status: shouldTrigger && !duplicateTrigger ? 'triggered' : 'checked',
      message: duplicateTrigger
        ? 'Alert already has a pending notification for this matching result.'
        : shouldTrigger
          ? 'Alert triggered and marked notification-ready.'
          : 'Checked successfully.',
      currentLowestPrice: lowest.price
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Vehicle price alert check failed', error);
    }

    await prisma.priceAlert.update({
      where: { id: priceAlert.id },
      data: { lastCheckedAt: now }
    }).catch(() => null);

    return {
      alertId: priceAlert.id,
      status: 'failed',
      message: 'Search provider failed while checking this alert.'
    };
  }
}
