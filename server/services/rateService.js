import prisma from '../config/prismaClient.js';
import areaRepository from '../repositories/areaRepository.js';
import rateCardRepository from '../repositories/rateCardRepository.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export class RateService {
  /**
   * Calculate delivery charges and weight parameters based on package size and pickup/drop routes.
   * @param {object} input 
   * @returns {Promise<object>} Price breakdown and routing details
   */
  async calculateRate(input) {
    const {
      pickupAreaId,
      dropAreaId,
      length,
      width,
      height,
      actualWeight,
      orderType,
      paymentType
    } = input;

    // 1. Resolve volumetric divisor from system configs (fallback to 5000)
    const configRecord = await prisma.systemConfig.findUnique({
      where: { key: 'VOLUMETRIC_DIVISOR' }
    });
    const divisor = configRecord ? parseFloat(configRecord.value) : 5000;

    // 2. Volumetric and Billable Weight calculations
    const rawVolumetricWeight = (length * width * height) / divisor;
    const volumetricWeight = Math.round(rawVolumetricWeight * 100) / 100;
    const billableWeight = Math.round(Math.max(actualWeight, volumetricWeight) * 100) / 100;

    // 3. Resolve pickup and drop areas to their respective active zones
    const pickupArea = await areaRepository.findById(pickupAreaId);
    if (!pickupArea) {
      throw new NotFoundError('Pickup Area not found or is inactive');
    }

    const dropArea = await areaRepository.findById(dropAreaId);
    if (!dropArea) {
      throw new NotFoundError('Drop Area not found or is inactive');
    }

    const pickupZoneId = pickupArea.zoneId;
    const dropZoneId = dropArea.zoneId;

    // 4. Resolve pricing rules from the rate cards database
    const rateCard = await rateCardRepository.findByRoute(pickupZoneId, dropZoneId, orderType);
    if (!rateCard) {
      throw new NotFoundError(
        `No Rate Card pricing has been configured for shipments of type [${orderType}] from zone "${pickupArea.zone.name}" to zone "${dropArea.zone.name}".`
      );
    }

    // 5. Build pricing breakdown
    const basePrice = rateCard.basePrice;
    const baseWeightLimit = rateCard.baseWeightLimit;
    const pricePerKg = rateCard.pricePerKg;
    const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0.0;

    let weightSurcharge = 0.0;
    if (billableWeight > baseWeightLimit) {
      const extraWeight = billableWeight - baseWeightLimit;
      weightSurcharge = Math.round((extraWeight * pricePerKg) * 100) / 100;
    }

    const finalPrice = Math.round((basePrice + weightSurcharge + codSurcharge) * 100) / 100;

    return {
      volumetricWeight,
      billableWeight,
      basePrice,
      weightSurcharge,
      codSurcharge,
      finalPrice,
      pickupZone: pickupArea.zone.name,
      dropZone: dropArea.zone.name,
      pickupZoneId,
      dropZoneId,
      pickupAreaId,
      dropAreaId
    };
  }
}

export default new RateService();
