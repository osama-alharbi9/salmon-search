import WorkView from "./WorkView";

// Catch-all dynamic route: /work/Namespace/Slug -> id = "Namespace/Slug".
// In Next 16 params is a Promise and must be awaited.
export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  return <WorkView id={id.map(decodeURIComponent).join("/")} />;
}
