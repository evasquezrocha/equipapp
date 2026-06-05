import { documents } from "@/lib/mock-data";

export default function DocumentosPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Evidencias</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Documentos y fotos</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Las rutas de Dropbox quedan organizadas por empresa, equipo y tipo de archivo para
          facilitar búsquedas y auditoría.
        </p>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <article
            key={doc.name}
            className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{doc.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{doc.company}</p>
              </div>
              <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                {doc.type}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <p>
                <span className="text-slate-400">Equipo:</span> {doc.equipment}
              </p>
              <p>
                <span className="text-slate-400">Ruta Dropbox:</span> {doc.path}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
