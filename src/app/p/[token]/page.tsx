import { ViewerClient } from "@/components/viewer/ViewerClient";

export default async function ParticipantPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ViewerClient token={token} />;
}
