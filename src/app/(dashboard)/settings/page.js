"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { adminSettingsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

const DEFAULTS = {
  DISCOUNT_TIERS: [
    { threshold: 3500, percent: 15, label: "15% OFF" },
    { threshold: 2000, percent: 10, label: "10% OFF" },
    { threshold: 500, percent: 5, label: "5% OFF" },
  ],
  SHIPPING: { FREE_THRESHOLD: 1200, STANDARD_RATE: 99 },
  GIFT_WRAP_COST: 99,
  LOYALTY_RATE: 0.1,
  REFERRAL_REWARD: 200,
  loyalty_config: {
    enabled: true,
    earnRatePerRupee: 0.1,
    redeemRatePerPoint: 1,
    minRedemptionPoints: 100,
    maxPercentOfOrder: 50,
    expiryDays: 365,
    showInProfile: true,
  },
  referral_config: {
    enabled: true,
    rewardMode: "loyalty_points_referrer",
    referrerRewardValue: 200,
    refereeRewardValue: 100,
    referrerCouponDiscountType: "fixed",
    refereeCouponDiscountType: "fixed",
    couponValidityDays: 30,
    qualifyingOrderMinValue: 0,
    codePrefix: "CLEANSE-",
  },
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [discountTiers, setDiscountTiers] = useState(DEFAULTS.DISCOUNT_TIERS);
  const [shipping, setShipping] = useState(DEFAULTS.SHIPPING);
  const [giftWrapCost, setGiftWrapCost] = useState(DEFAULTS.GIFT_WRAP_COST);
  const [loyaltyRate, setLoyaltyRate] = useState(DEFAULTS.LOYALTY_RATE);
  const [referralReward, setReferralReward] = useState(DEFAULTS.REFERRAL_REWARD);
  const [loyaltyConfig, setLoyaltyConfig] = useState(DEFAULTS.loyalty_config);
  const [referralConfig, setReferralConfig] = useState(DEFAULTS.referral_config);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.get();
      if (data) {
        setDiscountTiers(
          data.DISCOUNT_TIERS && data.DISCOUNT_TIERS.length > 0
            ? [...data.DISCOUNT_TIERS].sort((a, b) => b.threshold - a.threshold)
            : DEFAULTS.DISCOUNT_TIERS
        );
        setShipping(data.SHIPPING ?? DEFAULTS.SHIPPING);
        setGiftWrapCost(data.GIFT_WRAP_COST ?? DEFAULTS.GIFT_WRAP_COST);
        setLoyaltyRate(data.LOYALTY_RATE ?? DEFAULTS.LOYALTY_RATE);
        setReferralReward(data.REFERRAL_REWARD ?? DEFAULTS.REFERRAL_REWARD);
        setLoyaltyConfig({ ...DEFAULTS.loyalty_config, ...(data.loyalty_config || {}) });
        setReferralConfig({ ...DEFAULTS.referral_config, ...(data.referral_config || {}) });
      }
    } catch {
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sortedTiers = [...discountTiers].sort(
        (a, b) => Number(b.threshold) - Number(a.threshold)
      );
      await adminSettingsApi.update({
        DISCOUNT_TIERS: sortedTiers.map((t) => ({
          threshold: Number(t.threshold),
          percent: Number(t.percent),
          label: t.label,
        })),
        SHIPPING: {
          FREE_THRESHOLD: Number(shipping.FREE_THRESHOLD),
          STANDARD_RATE: Number(shipping.STANDARD_RATE),
        },
        GIFT_WRAP_COST: Number(giftWrapCost),
        LOYALTY_RATE: Number(loyaltyRate),
        REFERRAL_REWARD: Number(referralReward),
        loyalty_config: {
          enabled: !!loyaltyConfig.enabled,
          earnRatePerRupee: Number(loyaltyConfig.earnRatePerRupee),
          redeemRatePerPoint: Number(loyaltyConfig.redeemRatePerPoint),
          minRedemptionPoints: Number(loyaltyConfig.minRedemptionPoints),
          maxPercentOfOrder: Number(loyaltyConfig.maxPercentOfOrder),
          expiryDays: Number(loyaltyConfig.expiryDays),
          showInProfile: !!loyaltyConfig.showInProfile,
        },
        referral_config: {
          enabled: !!referralConfig.enabled,
          rewardMode: referralConfig.rewardMode,
          referrerRewardValue: Number(referralConfig.referrerRewardValue),
          refereeRewardValue: Number(referralConfig.refereeRewardValue),
          referrerCouponDiscountType: referralConfig.referrerCouponDiscountType,
          refereeCouponDiscountType: referralConfig.refereeCouponDiscountType,
          couponValidityDays: Number(referralConfig.couponValidityDays),
          qualifyingOrderMinValue: Number(referralConfig.qualifyingOrderMinValue),
          codePrefix: referralConfig.codePrefix || "CLEANSE-",
        },
      });
      setDiscountTiers(sortedTiers);
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (index, field, value) => {
    setDiscountTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const addTier = () => {
    setDiscountTiers((prev) => [...prev, { threshold: 0, percent: 0, label: "" }]);
  };

  const removeTier = (index) => {
    setDiscountTiers((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage pricing rules, shipping, and rewards
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage pricing rules, shipping, and rewards
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Cart Tier Discounts */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Cart Tier Discounts
            </h2>
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Tier
            </button>
          </div>

          {discountTiers.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No discount tiers configured. Click "Add Tier" to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3">
                <label className="text-xs font-medium text-zinc-500">
                  Threshold (&#8377;)
                </label>
                <label className="text-xs font-medium text-zinc-500">
                  Discount (%)
                </label>
                <label className="text-xs font-medium text-zinc-500">Label</label>
                <span />
              </div>

              {discountTiers.map((tier, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 items-center"
                >
                  <input
                    type="number"
                    min="0"
                    value={tier.threshold}
                    onChange={(e) => updateTier(index, "threshold", e.target.value)}
                    placeholder="e.g. 3500"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.percent}
                    onChange={(e) => updateTier(index, "percent", e.target.value)}
                    placeholder="e.g. 15"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) => updateTier(index, "label", e.target.value)}
                    placeholder="e.g. 15% OFF"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Remove tier"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Shipping */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Shipping</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Free Shipping Threshold (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={shipping.FREE_THRESHOLD}
                onChange={(e) =>
                  setShipping((prev) => ({
                    ...prev,
                    FREE_THRESHOLD: e.target.value,
                  }))
                }
                placeholder="e.g. 1200"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Standard Shipping Rate (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={shipping.STANDARD_RATE}
                onChange={(e) =>
                  setShipping((prev) => ({
                    ...prev,
                    STANDARD_RATE: e.target.value,
                  }))
                }
                placeholder="e.g. 99"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Gift Wrap */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">Gift Wrap</h2>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Gift Wrap Cost (&#8377;)
            </label>
            <input
              type="number"
              min="0"
              value={giftWrapCost}
              onChange={(e) => setGiftWrapCost(e.target.value)}
              placeholder="e.g. 99"
              className={inputClass}
            />
          </div>
        </div>

        {/* Section 4: Loyalty & Referral */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Loyalty &amp; Referral
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Loyalty Rate (points per &#8377;)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loyaltyRate}
                onChange={(e) => setLoyaltyRate(e.target.value)}
                placeholder="e.g. 0.1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referral Reward (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={referralReward}
                onChange={(e) => setReferralReward(e.target.value)}
                placeholder="e.g. 200"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Loyalty Program Config */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Loyalty Program
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!loyaltyConfig.enabled}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, enabled: e.target.checked })
                }
              />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Earn rate (points per &#8377;)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={loyaltyConfig.earnRatePerRupee}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, earnRatePerRupee: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Redeem rate (&#8377; per point)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={loyaltyConfig.redeemRatePerPoint}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, redeemRatePerPoint: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Minimum redemption (points)
              </label>
              <input
                type="number"
                min="0"
                value={loyaltyConfig.minRedemptionPoints}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, minRedemptionPoints: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Max % of order paid by points
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={loyaltyConfig.maxPercentOfOrder}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, maxPercentOfOrder: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Expiry (days, 0 = no expiry)
              </label>
              <input
                type="number"
                min="0"
                value={loyaltyConfig.expiryDays}
                onChange={(e) =>
                  setLoyaltyConfig({ ...loyaltyConfig, expiryDays: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Referral Program Config */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Referral Program
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!referralConfig.enabled}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, enabled: e.target.checked })
                }
              />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Reward mode
              </label>
              <select
                value={referralConfig.rewardMode}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, rewardMode: e.target.value })
                }
                className={inputClass}
              >
                <option value="loyalty_points_referrer">Points to referrer only</option>
                <option value="loyalty_points_both">Points to both sides</option>
                <option value="coupon_referrer">Coupon to referrer only</option>
                <option value="coupon_both">Coupon to both sides</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Code prefix
              </label>
              <input
                type="text"
                value={referralConfig.codePrefix}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, codePrefix: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referrer reward value
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.referrerRewardValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, referrerRewardValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referee reward value
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.refereeRewardValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, refereeRewardValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referrer coupon type (if coupon mode)
              </label>
              <select
                value={referralConfig.referrerCouponDiscountType}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, referrerCouponDiscountType: e.target.value })
                }
                className={inputClass}
              >
                <option value="fixed">Fixed (&#8377;)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Referee coupon type (if coupon mode)
              </label>
              <select
                value={referralConfig.refereeCouponDiscountType}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, refereeCouponDiscountType: e.target.value })
                }
                className={inputClass}
              >
                <option value="fixed">Fixed (&#8377;)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Coupon validity (days)
              </label>
              <input
                type="number"
                min="1"
                value={referralConfig.couponValidityDays}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, couponValidityDays: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Qualifying order min value (&#8377;)
              </label>
              <input
                type="number"
                min="0"
                value={referralConfig.qualifyingOrderMinValue}
                onChange={(e) =>
                  setReferralConfig({ ...referralConfig, qualifyingOrderMinValue: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
