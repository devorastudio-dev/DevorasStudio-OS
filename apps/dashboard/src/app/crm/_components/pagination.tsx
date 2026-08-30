import Link from "next/link";
export function Pagination({
  page,
  count,
  pageSize,
  params,
}: {
  page: number;
  count: number;
  pageSize: number;
  params: URLSearchParams;
}) {
  const total = Math.max(1, Math.ceil(count / pageSize));
  const url = (next: number) => {
    const copy = new URLSearchParams(params);
    copy.set("page", String(next));
    return `?${copy}`;
  };
  return (
    <nav aria-label="Paginação" className="crm-pagination">
      <span>
        Página {page} de {total}
      </span>
      <div>
        {page > 1 ? <Link href={url(page - 1)}>Anterior</Link> : null}
        {page < total ? <Link href={url(page + 1)}>Próxima</Link> : null}
      </div>
    </nav>
  );
}
