"use client";

import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function PayButton({ amount }: { amount: number }) {
  const payNow = async () => {
    try {
      // 1️⃣ Create order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Order creation failed:", errorData);
        alert(`Failed to create order: ${errorData.error || errorData.message || "Unknown error"}`);
        return;
      }

      const order = await res.json();

      // 2️⃣ Check Razorpay SDK
      if (!(window as any).Razorpay) {
        alert("Razorpay SDK not loaded");
        return;
      }

      // 3️⃣ Open Razorpay portal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        order_id: order.id,
        name: "Timely Project",
        description: "Complete your payment",
        handler: (response: any) => {
          console.log("Payment success", response);
          alert("Payment successful!");
        },
        theme: { color: "#16a34a" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={payNow}
      className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-green-700 transition"
    >
      <CreditCard size={20} />
      Pay ₹{amount}
    </motion.button>
  );
}
