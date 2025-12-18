"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle } from "lucide-react";
import PayButton from "@/components/PayButton";

const TOTAL_AMOUNT = 12000;

export default function Page() {
  const [plan, setPlan] = useState<1 | 3 | 6>(1);

  const payable = TOTAL_AMOUNT / plan;
  const remaining = TOTAL_AMOUNT - payable;
  const progress = (1 / plan) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-green-700">
            Complete Your Payment
          </h2>
          <p className="text-gray-500">
            Total Amount: <span className="font-semibold">₹{TOTAL_AMOUNT}</span>
          </p>
        </div>

        {/* Plan Selector */}
        <div className="space-y-3">
          {[1, 3, 6].map((p) => (
            <motion.button
              whileTap={{ scale: 0.97 }}
              key={p}
              onClick={() => setPlan(p as 1 | 3 | 6)}
              className={`w-full p-4 rounded-xl border flex justify-between items-center transition
                ${
                  plan === p
                    ? "border-green-600 bg-green-100 text-green-700"
                    : "border-gray-200 hover:border-green-400"
                }`}
            >
              <span className="font-medium">
                {p === 1 ? "Pay Full" : `${p} Installments`}
              </span>
              <span className="font-semibold">₹{TOTAL_AMOUNT / p}</span>
            </motion.button>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-green-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Pay Now</span>
            <span className="font-bold text-green-700">₹{payable}</span>
          </div>

          {plan !== 1 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Remaining</span>
              <span>₹{remaining}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {plan !== 1 && (
          <div>
            <div className="flex justify-between text-xs mb-1 text-gray-500">
              <span>Installment Progress</span>
              <span>1 / {plan}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-2 bg-green-600 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Pay Button */}
        <PayButton amount={payable} />
      </motion.div>
    </div>
  );
}
