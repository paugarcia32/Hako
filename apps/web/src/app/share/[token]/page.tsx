export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <h1>Shared collection {token}</h1>;
}
