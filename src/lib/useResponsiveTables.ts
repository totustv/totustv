import { useEffect } from 'react';

/**
 * Copia o texto de cada <th> para o atributo `data-label` das <td> correspondentes
 * em todas as tabelas `.table`. No mobile, o CSS usa esse atributo para transformar
 * cada linha da tabela em um "card" legível (rótulo à esquerda, valor à direita),
 * eliminando a rolagem horizontal.
 */
export function useResponsiveTables() {
  useEffect(() => {
    let frame = 0;

    const applyLabels = () => {
      frame = 0;
      document.querySelectorAll<HTMLTableElement>('table.table').forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
          (th.textContent || '').trim()
        );
        if (headers.length === 0) return;

        table.querySelectorAll('tbody tr').forEach(row => {
          Array.from(row.children).forEach((cell, idx) => {
            const label = headers[idx] ?? '';
            if (cell.getAttribute('data-label') !== label) {
              cell.setAttribute('data-label', label);
            }
          });
        });
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(applyLabels);
    };

    applyLabels();
    // Observa apenas mudanças estruturais (childList); setar atributos não reaciona o observer.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
