import ResultsClient from '@/app/components/ResultsClient';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultsClient sessionId={id} />;
}
