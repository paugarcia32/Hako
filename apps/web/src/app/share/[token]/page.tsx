export default function SharePage({ params }: { params: { token: string } }) {
  return <h1>Shared collection {params.token}</h1>;
}
