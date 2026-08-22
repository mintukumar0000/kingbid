import { redirect } from "next/navigation";

/** Legacy query-param success URLs → /success/[paymentId] */
export default async function SuccessRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  if (payment) redirect(`/success/${encodeURIComponent(payment)}`);
  redirect("/");
}
