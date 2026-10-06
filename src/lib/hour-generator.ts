import { escapeHtml } from "@/lib/escape-html";

export type ParsedAttendance = {
  d: number;
  m: number;
  star: string;
  nome: string;
  val: number | null;
  i: number;
};

export const brl = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function parseAttendance(txt: string, periodStart: string): ParsedAttendance[] {
  const out: ParsedAttendance[] = [];
  txt.split("\n").forEach((raw, i) => {
    let l = raw.replace(/^[\s\-•]+/, "").trim();
    if (!l) return;
    const m = l.match(/^(\d{1,2})\/(\d{1,2})(\*?)\s+(.+)$/);
    if (!m) return;
    const [, day, month, star = "", name] = m;
    if (!day || !month || !name) return;
    let rest = name.trim();
    let val: number | null = null;
    if (/sem\s+valor/i.test(rest)) {
      rest = rest.replace(/[\s\-–]*sem\s+valor.*$/i, "").trim();
    } else {
      const v = rest.match(/^(.*?)[\s\-–:]*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)\s*$/);
      if (v?.[1] !== undefined && v[2] !== undefined) {
        rest = v[1].trim();
        let n = v[2];
        n = n.includes(",") ? n.replace(/\./g, "").replace(",", ".") : n;
        val = parseFloat(n);
      }
    }
    out.push({ d: +day, m: +month, star, nome: rest, val, i });
  });

  const im = parseInt((periodStart.split("/")[1]) || "1", 10);
  const k = (a: ParsedAttendance) => ((a.m < im ? a.m + 12 : a.m) * 100 + a.d);
  return out.sort((a, b) => k(a) - k(b) || a.i - b.i);
}

export function makeAttendanceReportHtml(opts: {
  collaboratorName: string;
  competence: string;
  periodStart: string;
  periodEnd: string;
  repassePercent: number;
  data: string;
}) {
  const at = parseAttendance(opts.data, opts.periodStart);
  const pct = Number.isFinite(opts.repassePercent) ? opts.repassePercent : 0;
  const p = (n: number) => String(n).padStart(2, "0");
  const title = `RELATÓRIO DE ATENDIMENTOS - ${opts.collaboratorName.toUpperCase()}`;
  const subtitle = `Competência: ${opts.competence}  |  Período: ${opts.periodStart} a ${opts.periodEnd}`;
  const rows = at.map((a) =>
    `<tr><td class="c">${p(a.d)}/${p(a.m)}${a.star}</td><td>${escapeHtml(a.nome)}</td><td class="r">${a.val === null ? "Sem valor informado" : brl(a.val)}</td></tr>`
  ).join("");
  const com = at.filter((a) => a.val !== null);
  const total = com.reduce((sum, a) => sum + Number(a.val), 0);
  const repasse = total * pct / 100;
  const fp = String(pct).replace(".", ",");
  const sem = at.filter((a) => a.val === null).map((a) => `${escapeHtml(a.nome)} (${p(a.d)}/${p(a.m)})`);
  const obs = at.some((a) => a.star) ? " * Atendimento com observação." : "";
  const note = (sem.length ? "Atendimentos sem valor informado: " + sem.join(", ") + "." : "") + obs;
  const logo = "/__l5e/assets-v1/6c7fcdfc-705e-4b26-9799-c2d14e1fe6ae/logo-equilibre.png";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Gerador de Relatório de Atendimentos</title>
<style>
:root{--bg:#f6f1ef;--panel:#fff;--ink:#3a2a27;--muted:#777;--line:#e3c6bf;--head:#c98072;--title:#8b5048;--alt:#f8eeeb}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Helvetica,Arial,sans-serif;font-size:15px}
.wrap{max-width:820px;margin:0 auto;padding:16px}
.paper{background:#fff;color:#222;border:1px solid var(--line);border-radius:4px;padding:28px 24px;max-width:100%}
.paper img{display:block;margin:0 auto 14px;width:84px;height:84px}
.paper h1{text-align:center;color:var(--title);font-size:20px;margin:0 0 6px}
.paper .sub{text-align:center;color:#666;font-size:13px;margin-bottom:18px}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--head);color:#fff;text-align:left;padding:8px 10px}
td{border:1px solid var(--line);padding:8px 10px}
tbody tr:nth-child(even){background:var(--alt)}
.c{text-align:center}.r{text-align:right}
.res{margin-top:22px;max-width:520px}
.res th{font-size:14px}
.res td.r{white-space:nowrap}
.res tr.b td{font-weight:bold}
.res tr.rep td{background:var(--alt);font-weight:bold}
.note{font-size:12px;color:#555;margin-top:10px}
@media print{body{background:#fff}.wrap{padding:0;max-width:none}.paper{border:0;padding:0}th,tr,td{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:14mm}}
</style>
</head>
<body>
<div class="wrap">
<div class="paper" id="paper">
<img src="${logo}" alt="Espaço Equilibre">
<h1>${escapeHtml(title)}</h1>
<div class="sub">${escapeHtml(subtitle)}</div>
<div class="scroll"><table><thead><tr><th class="c" style="width:90px">Data</th><th>Paciente</th><th class="r">Valor</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="scroll res"><table><thead><tr><th colspan="2">Resumo do período</th></tr></thead><tbody>
<tr><td>Total de atendimentos realizados</td><td class="r">${at.length}</td></tr>
<tr><td>Atendimentos com valor informado</td><td class="r">${com.length}</td></tr>
<tr><td>Atendimentos sem valor informado</td><td class="r">${at.length - com.length}</td></tr>
<tr class="b"><td>Valor total contabilizado</td><td class="r">${brl(total)}</td></tr>
<tr class="rep"><td>Repasse (${fp}% do valor total)</td><td class="r">${brl(repasse)}</td></tr>
</tbody></table></div>
<div class="note">${note}</div>
</div>
</div>
</body>
</html>`;
}
