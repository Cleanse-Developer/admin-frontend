"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { adminSpecialCouponApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import SpecialCouponFormPage from "../special-coupon-form";

export default function EditSpecialCouponPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSpecialCouponApi
      .get(id)
      .then((data) => setPromotion(data?.promotion || data))
      .catch(() => showToast("Failed to load promotion", "error"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-500">Promotion not found</div>
      </div>
    );
  }

  return <SpecialCouponFormPage promotion={promotion} />;
}
