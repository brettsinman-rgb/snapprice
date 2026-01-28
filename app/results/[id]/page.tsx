import ResultsClient from '@/app/components/ResultsClient';

export const dynamic = 'force-dynamic';

export default function ResultsPage({ params }: { params: { id: string } }) {
  return <ResultsClient sessionId={params.id} />;
}
