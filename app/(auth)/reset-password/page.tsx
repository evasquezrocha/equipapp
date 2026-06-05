import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 text-sm text-slate-300">
          Cargando recuperacion...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
