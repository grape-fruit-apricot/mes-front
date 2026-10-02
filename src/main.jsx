import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Factory, ClipboardList, ChartNoAxesCombined, PackageCheck, Boxes, Tags, Search, Plus, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw, X, ArrowRight, CircleHelp, Check, AlertCircle } from 'lucide-react';
import { api } from './api';
import { statuses, validateProduction, canReceive } from './domain';
import './styles.css';

const pages = {
  'work-orders': { title: '작업지시', sub: '작업의 시작부터 입고까지, 생산 흐름을 한눈에 관리하세요.', icon: ClipboardList, id: 'workOrderId', date: '생성일' },
  'production-results': { title: '생산실적', sub: '완료된 생산의 양품과 불량 수량을 확인하고 입고를 진행하세요.', icon: ChartNoAxesCombined, id: 'resultId', date: '실적 등록일' },
  'goods-receipts': { title: '입고이력', sub: '생산을 마친 양품의 입고 기록을 확인하세요.', icon: PackageCheck, id: 'receiptId', date: '입고일' },
  inventory: { title: '재고현황', sub: '입고 내역이 반영된 품목별 현재 재고를 확인하세요.', icon: Boxes, id: 'itemId' },
  items: { title: '품목정보', sub: '생산과 재고 관리에 사용되는 품목 기준정보입니다.', icon: Tags, id: 'itemId' },
};
const fmt = n => n == null ? '—' : Number(n).toLocaleString('ko-KR');
const date = value => value ? new Date(value).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const emptyFilter = { keyword: '', status: '', from: '', to: '' };
function Badge({ status }) { return <span className={`badge ${status}`}><i />{statuses[status] || status}</span>; }
function App() {
  const initial = window.location.hash.slice(1);
  const [view, setView] = useState(pages[initial] ? initial : 'work-orders');
  const [draft, setDraft] = useState(emptyFilter), [filter, setFilter] = useState(emptyFilter);
  const [page, setPage] = useState(1), [rows, setRows] = useState([]), [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState(null), [notice, setNotice] = useState('');
  const config = pages[view];
  function navigate(next) { setView(next); setPage(1); setDraft(emptyFilter); setFilter(emptyFilter); setRows([]); setModal(null); window.location.hash = next; }
  useEffect(() => { const fn = () => { const key = window.location.hash.slice(1); if (pages[key]) { setView(key); setPage(1); setDraft(emptyFilter); setFilter(emptyFilter); } }; window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRows([]); setHasNext(false);
    const query = new URLSearchParams({ page, size: 10 });
    Object.entries(filter).forEach(([k, v]) => { if (v && (config.date || k === 'keyword')) query.set(k, v); });
    (async () => {
      try {
        const data = await api(`/${view}?${query}`, { signal: controller.signal });
        if (!Array.isArray(data)) throw new Error('목록 응답 형식이 올바르지 않습니다.');
        let next = false;
        if (data.length === 10) { query.set('page', page + 1); const more = await api(`/${view}?${query}`, { signal: controller.signal }); next = more.length > 0; }
        if (!controller.signal.aborted) { setRows(data); setHasNext(next); }
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [view, filter, page, refresh]);
  useEffect(() => { if (notice) { const id = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(id); } }, [notice]);
  function search(e) { e.preventDefault(); if (draft.from && draft.to && draft.from > draft.to) return; setFilter({ ...draft }); setPage(1); }
  const counts = [rows.length, rows.filter(r => r.status === 'READY').length, rows.filter(r => r.status === 'IN_PROGRESS').length, rows.filter(r => r.status === 'COMPLETED').length];
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#work-orders" onClick={() => navigate('work-orders')}><span className="brand-icon"><Factory size={23}/></span><span>hansol<span className="brand-sub">MANUFACTURING SYSTEM</span></span></a>
      <div className="workspace"><span className="workspace-mark">H</span><div>한솔 생산관리<small>Mini MES Workspace</small></div><span className="workspace-dot"/></div>
      <div className="nav-caption">WORKSPACE</div><nav>{Object.entries(pages).map(([key, p]) => <button key={key} className={view === key ? 'nav-item active' : 'nav-item'} onClick={() => navigate(key)}><p.icon size={19}/>{p.title}{view === key && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-note"><Factory size={22}/><strong>작은 공정, 완전한 연결</strong><p>작업지시부터 재고까지<br/>하나의 흐름으로 관리합니다.</p><span>HANSOL MINI MES <ArrowUpRight size={14}/></span></div>
      <div className="sidebar-footer"><span className="avatar">H</span><div>생산관리 워크스페이스<small>단일 창고 · 통합 운영</small></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span>워크스페이스 <ChevronRight size={14}/> <b>{config.title}</b></span><span className="top-label"><span className="green-dot"/> 생산 운영 시스템</span></header>
      <main><div className="heading"><div><div className="eyebrow">PRODUCTION MANAGEMENT</div><h1>{config.title}<span className="title-dot">.</span></h1><p>{config.sub}</p></div><button className="primary" onClick={() => setModal({ type: 'create' })}><Plus size={17}/> 작업지시 생성</button></div>
      <div className="flow"><span className="flow-label">생산 프로세스</span>{['작업지시 생성', '작업 시작', '생산실적 등록', '양품 입고'].map((s, i) => <React.Fragment key={s}><div><span className="step">0{i + 1}</span>{s}</div>{i < 3 && <ArrowRight size={15}/>}</React.Fragment>)}<span className="flow-end"><Check size={14}/> 재고 자동 반영</span></div>
      {view === 'work-orders' ? <section className="metrics" aria-label="현재 페이지 작업 현황">{['조회된 작업지시', '작업 대기', '생산 중', '생산 완료'].map((label, i) => <div className={`metric metric-${i}`} key={label}><div><span>{label}</span><span className="metric-symbol">{['▦', '◷', '↗', '✓'][i]}</span></div><strong>{loading || error ? '—' : fmt(counts[i])}<small>건</small></strong><p>{i === 0 ? '현재 페이지 기준' : ['','생산 시작 전 작업','현재 진행 중인 작업','실적 등록이 완료된 작업'][i]}</p></div>)}</section> : <div className="section-note"><config.icon size={19}/>{view === 'inventory' ? '재고는 양품 입고 시 자동 반영됩니다. 입고 이력이 없는 품목의 재고는 0으로 표시됩니다.' : view === 'items' ? '품목은 현재 조회만 지원합니다. 등록된 품목으로 작업지시를 생성할 수 있습니다.' : '작업지시 상세에서 생산 흐름과 관련 기록을 함께 확인할 수 있습니다.'}</div>}
      <section className="list-card"><div className="list-heading"><h2>{config.title} 목록 <span>{loading || error ? '—' : `${rows.length}건`}</span></h2><button className="text-button" onClick={() => setRefresh(n => n + 1)} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''}/> 새로고침</button></div>
        <form className="filters" onSubmit={search}><div className="search-input"><Search size={17}/><input aria-label="품목 검색" placeholder="품목 코드 또는 품목명 검색" maxLength={100} value={draft.keyword} onChange={e => setDraft({ ...draft, keyword: e.target.value })}/></div>{config.date && <><select aria-label="작업 상태" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">전체 상태</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><div className="date-filter"><label>{config.date}</label><input aria-label="시작일" type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })}/><span>–</span><input aria-label="종료일" type="date" min={draft.from} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })}/></div></>}<button type="submit" className="secondary">검색</button><button type="button" className="text-button" onClick={() => { setDraft(emptyFilter); setFilter(emptyFilter); setPage(1); }}>초기화</button></form>
        {loading ? <div className="empty" role="status"><RefreshCw className="spin"/><h3>데이터를 불러오고 있습니다</h3><p>잠시만 기다려 주세요.</p></div> : error ? <div className="empty error" role="alert"><AlertCircle/><h3>데이터를 불러오지 못했습니다</h3><p>{error}</p><button className="secondary" onClick={() => setRefresh(n => n + 1)}>다시 시도</button></div> : rows.length === 0 ? <div className="empty"><Boxes size={32}/><h3>조회된 {config.title} 정보가 없습니다</h3><p>검색 조건을 변경하거나 새로운 작업지시를 생성해 주세요.</p></div> : <div className="table-scroll"><table><thead><tr>{(view === 'work-orders' ? ['작업지시 번호', '품목', '지시 수량', '작업 상태', '입고 상태', '생성일', '상세'] : view === 'production-results' ? ['작업지시 번호', '품목', '양품', '불량', '입고 상태', '실적 등록일', '상세'] : view === 'goods-receipts' ? ['입고 번호', '작업지시 번호', '품목', '입고 수량', '입고일', '상세'] : view === 'inventory' ? ['품목 코드', '품목명', '현재 재고', '단위', '최종 반영일', '상세'] : ['품목 코드', '품목명', '단위', '상세']).map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row[config.id]}>
          {view === 'work-orders' && <><td className="mono">{row.orderNo}</td><td><Item row={row}/></td><td className="numeric">{fmt(row.plannedQty)} <small>{row.unit}</small></td><td><Badge status={row.status}/></td><td><Receipt row={row}/></td><td className="date-cell">{date(row.createdAt)}</td></>}
          {view === 'production-results' && <><td className="mono">{row.orderNo}</td><td><Item row={row}/></td><td className="numeric">{fmt(row.goodQty)}</td><td className={row.defectQty > 0 ? 'defect numeric' : 'numeric'}>{fmt(row.defectQty)}</td><td><Receipt row={row}/></td><td className="date-cell">{date(row.recordedAt)}</td></>}
          {view === 'goods-receipts' && <><td className="mono">GR-{row.receiptId}</td><td className="mono">{row.orderNo}</td><td><Item row={row}/></td><td className="numeric">{fmt(row.receivedQty)}</td><td className="date-cell">{date(row.receivedAt)}</td></>}
          {(view === 'items' || view === 'inventory') && <><td className="mono">{row.itemCode}</td><td><strong>{row.itemName}</strong></td>{view === 'inventory' && <td className="numeric">{fmt(row.quantity)}</td>}<td>{row.unit}</td>{view === 'inventory' && <td className="date-cell">{date(row.updatedAt)}</td>}</>}
          <td><button className="detail-button" aria-label={`${row.orderNo || row.itemName} 상세 보기`} onClick={() => setModal({ type: 'detail', path: `/${view}/${row[config.id]}`, view })}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table></div>}
        <div className="pagination"><span>페이지당 10건 <span className="divider">|</span> {page} 페이지{!loading && !error && ` · ${rows.length}건 표시`}</span><div><button aria-label="이전 페이지" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/></button><span className="page-number">{page}</span><button aria-label="다음 페이지" disabled={!hasNext || loading || !!error} onClick={() => setPage(p => p + 1)}><ChevronRight size={16}/></button></div></div>
      </section><div className="footnote"><CircleHelp size={15}/> 작업지시는 대기 → 생산 중 → 생산 완료 순으로 진행되며, 양품 입고 시 재고에 반영됩니다.</div><footer>© {new Date().getFullYear()} HANSOL MINI MES<span>생산의 모든 흐름을 연결합니다.</span></footer></main>
    </div>{modal && <Modal key={`${modal.type}-${modal.path || ''}`} modal={modal} close={() => setModal(null)} done={message => { setModal(null); setNotice(message); setRefresh(n => n + 1); }} change={setModal}/>}{notice && <div className="toast" role="status"><Check size={18}/>{notice}</div>}
  </div>;
}
function Item({ row }) { return <div className="item-cell"><strong>{row.itemName}</strong><small>{row.itemCode}</small></div>; }
function Receipt({ row }) { return row.receiptId != null ? <span className="received"><Check size={13}/> 입고 완료</span> : row.resultId == null ? <span className="muted">—</span> : row.goodQty === 0 ? <span className="muted">입고 대상 없음</span> : <span className="pending">입고 대기</span>; }

function Modal({ modal, close, done, change }) {
  const dialog = useRef(null), busyRef = useRef(false);
  const [row, setRow] = useState(null), [items, setItems] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [form, setForm] = useState({ orderNo: '', itemId: '', plannedQty: '', goodQty: '', defectQty: '0', defectReason: '' });
  useEffect(() => { const el = dialog.current; const focus = document.activeElement; el.showModal(); return () => { el.close(); focus?.focus(); }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    (async () => { try {
      if (modal.type === 'create') {
        const all = []; let p = 1;
        while (true) { const batch = await api(`/items?page=${p++}&size=100`, { signal: controller.signal }); all.push(...batch); if (batch.length < 100) break; }
        if (!controller.signal.aborted) setItems(all);
      } else { const data = await api(modal.path, { signal: controller.signal }); if (!controller.signal.aborted) { setRow(data); setForm(f => ({ ...f, goodQty: String(data.plannedQty ?? '') })); } }
    } catch (e) { if (!controller.signal.aborted) setError(e.message); } finally { if (!controller.signal.aborted) setLoading(false); } })();
    return () => controller.abort();
  }, [modal]);
  async function mutate(path, body, message) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await api(path, { method: 'POST', body }); done(message); }
    catch (e) { setError(e.message); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function submit(e) {
    e.preventDefault();
    if (modal.type === 'create') {
      if (!form.orderNo.trim()) { setError('작업지시 번호를 입력해 주세요.'); return; }
      mutate('/work-orders', { orderNo: form.orderNo.trim(), itemId: Number(form.itemId), plannedQty: Number(form.plannedQty) }, '작업지시가 생성되었습니다.');
    } else {
      const message = validateProduction(row.plannedQty, form.goodQty, form.defectQty, form.defectReason);
      if (message) { setError(message); return; }
      mutate(`/work-orders/${row.workOrderId}/production-result`, { goodQty: Number(form.goodQty), defectQty: Number(form.defectQty), defectReason: form.defectReason.trim() || null }, '생산실적이 등록되고 작업이 완료되었습니다.');
    }
  }
  const field = (key, label, props = {}) => <label className="field">{label}<input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} {...props}/></label>;
  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); if (!busy) close(); }} aria-labelledby="dialog-title"><div className="modal-heading"><div><div className="eyebrow">HANSOL WORKSPACE</div><h2 id="dialog-title">{modal.type === 'create' ? '새 작업지시 생성' : modal.type === 'production' ? '생산실적 등록' : `${pages[modal.view]?.title || '작업지시'} 상세`}</h2></div><button className="icon-button" aria-label="닫기" disabled={busy} onClick={close}><X size={21}/></button></div>
    {loading ? <div className="empty" role="status">정보를 불러오는 중입니다…</div> : <><div className="modal-body">{error && <div className="error-box" role="alert"><AlertCircle size={17}/>{error}</div>}
      {modal.type === 'create' ? <form id="modal-form" onSubmit={submit}><p className="modal-description">등록된 품목을 선택하고 생산할 수량을 입력하세요.</p><fieldset disabled={busy || !items.length}>{field('orderNo', '작업지시 번호', { required: true, maxLength: 30, placeholder: '예: WO-20260930-001' })}<label className="field">생산 품목<select required value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })}><option value="">품목을 선택해 주세요</option>{items.map(item => <option key={item.itemId} value={item.itemId}>{item.itemName} ({item.itemCode}) · {item.unit}</option>)}</select></label>{field('plannedQty', '지시 수량', { type: 'number', min: 1, max: 9999999999, step: 1, required: true, placeholder: '생산할 수량' })}</fieldset>{!items.length && !error && <p className="error-box">등록된 품목이 없습니다. DB 품목 기준정보를 확인해 주세요.</p>}<div className="info-box">생성된 작업지시는 ‘작업 대기’ 상태로 등록됩니다.</div></form> : row && modal.type === 'production' ? <form id="modal-form" onSubmit={submit}><div className="order-summary"><strong>{row.orderNo}</strong><p>{row.itemName} · 지시 수량 <b>{fmt(row.plannedQty)} {row.unit}</b></p></div><fieldset disabled={busy}><div className="field-grid">{field('goodQty', '양품 수량', { type: 'number', min: 0, max: 9999999999, step: 1, required: true })}{field('defectQty', '불량 수량', { type: 'number', min: 0, max: 9999999999, step: 1, required: true })}</div><label className="field">불량 사유 {Number(form.defectQty) > 0 && '(필수)'}<textarea maxLength={200} required={Number(form.defectQty) > 0} value={form.defectReason} onChange={e => setForm({ ...form, defectReason: e.target.value })} placeholder="불량 발생 사유를 입력해 주세요"/></label></fieldset><div className="info-box">입력 합계 {fmt(Number(form.goodQty) + Number(form.defectQty))} / 지시 수량 {fmt(row.plannedQty)}<br/>등록하면 생산이 완료됩니다. 양품 입고는 별도로 진행합니다.</div></form> : row && <><div className="order-summary"><strong>{row.orderNo || row.itemCode}</strong><p>{row.itemName}</p>{row.status && <Badge status={row.status}/>}</div><dl className="detail-grid">{[
        ['품목 코드', row.itemCode], ['단위', row.unit], ['지시 수량', row.plannedQty == null ? null : fmt(row.plannedQty)], ['현재 재고', row.quantity == null ? null : fmt(row.quantity)], ['양품 수량', row.goodQty == null ? null : fmt(row.goodQty)], ['불량 수량', row.defectQty == null ? null : fmt(row.defectQty)], ['불량 사유', row.defectReason], ['입고 번호', row.receiptId], ['입고 수량', row.receivedQty == null ? null : fmt(row.receivedQty)], ['생성일', row.createdAt && date(row.createdAt)], ['생산 완료일', row.completedAt && date(row.completedAt)], ['실적 등록일', row.recordedAt && date(row.recordedAt)], ['입고일', row.receivedAt && date(row.receivedAt)], ['최종 반영일', modal.view === 'inventory' ? date(row.updatedAt) : null],
      ].filter(([, v]) => v != null && v !== '').map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>{row.resultId != null && <div className="info-box"><Receipt row={row}/>{canReceive(row) && <p>입고 처리 시 양품 {fmt(row.goodQty)}개 전량이 재고에 반영됩니다.</p>}</div>}{row.status === 'READY' && <div className="info-box">작업을 시작하면 생산 중 상태로 변경됩니다.</div>}</>}
    </div><div className="modal-footer"><button className="secondary" disabled={busy} onClick={close}>닫기</button>{modal.type === 'create' && <button className="primary" type="submit" form="modal-form" disabled={busy || !items.length}>{busy ? '생성 중…' : '작업지시 생성'}</button>}{modal.type === 'production' && row && <button className="primary" type="submit" form="modal-form" disabled={busy}>{busy ? '등록 중…' : '실적 등록 및 생산 완료'}</button>}{modal.type === 'detail' && row && <>{row.status === 'READY' && <button className="primary" disabled={busy} onClick={() => mutate(`/work-orders/${row.workOrderId}/start`, undefined, '작업을 시작했습니다.')}>{busy ? '처리 중…' : '작업 시작'}</button>}{row.status === 'IN_PROGRESS' && <button className="primary" onClick={() => change({ type: 'production', path: `/work-orders/${row.workOrderId}` })}>생산실적 등록</button>}{canReceive(row) && <button className="primary" disabled={busy} onClick={() => mutate(`/production-results/${row.resultId}/receipt`, undefined, '양품 입고가 완료되고 재고에 반영되었습니다.')}>{busy ? '입고 중…' : '양품 전량 입고'}</button>}{modal.view !== 'work-orders' && row.workOrderId && <button className="secondary" disabled={busy} onClick={() => change({ type: 'detail', view: 'work-orders', path: `/work-orders/${row.workOrderId}` })}>작업지시 보기</button>}</>}</div></>}
  </dialog>;
}
createRoot(document.getElementById('root')).render(<App/>);
