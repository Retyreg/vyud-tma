import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getUserOrgs,
  joinOrg,
  getOrgGraph,
  streamNodeExplanation,
  type LmsOrg,
  type LmsNode,
} from '../api/lms';

// ─── helpers ────────────────────────────────────────────────────────────────

function userKey(user: { telegram_id?: number; email: string }): string {
  return user.telegram_id ? String(user.telegram_id) : user.email;
}

function buildFlowNodes(nodes: LmsNode[]): Node[] {
  const byLevel: Record<number, LmsNode[]> = {};
  for (const n of nodes) {
    (byLevel[n.level] ??= []).push(n);
  }
  const result: Node[] = [];
  const COL_W = 180;
  const ROW_H = 120;

  for (const [lvl, group] of Object.entries(byLevel)) {
    const level = Number(lvl);
    group.forEach((n, i) => {
      const total = group.length;
      result.push({
        id: String(n.id),
        type: 'lmsNode',
        position: {
          x: (i - (total - 1) / 2) * COL_W,
          y: (level - 1) * ROW_H,
        },
        data: { node: n },
      });
    });
  }
  return result;
}

function buildFlowEdges(edges: { source: number; target: number }[]): Edge[] {
  return edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: String(e.source),
    target: String(e.target),
    style: { stroke: 'var(--border)', strokeWidth: 1.5 },
  }));
}

// ─── Custom node ─────────────────────────────────────────────────────────────

const LmsNodeComponent: FC<NodeProps> = ({ data, selected }) => {
  const { node } = data as { node: LmsNode };
  const bg = node.is_completed
    ? '#4ade80'
    : node.is_available
    ? 'var(--primary)'
    : 'var(--border)';
  const textColor = node.is_completed || node.is_available ? '#fff' : 'var(--text-secondary)';

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '12px',
          background: bg,
          color: textColor,
          fontSize: '12px',
          fontWeight: 600,
          maxWidth: '160px',
          textAlign: 'center',
          boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.5)' : '0 2px 6px rgba(0,0,0,0.12)',
          opacity: node.is_available ? 1 : 0.55,
          cursor: node.is_available ? 'pointer' : 'default',
          transition: 'box-shadow 0.15s',
          lineHeight: 1.3,
        }}
      >
        {node.is_completed && <div style={{ fontSize: '14px', marginBottom: 4 }}>✅</div>}
        {node.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
};

const NODE_TYPES = { lmsNode: LmsNodeComponent };

// ─── Explanation drawer ───────────────────────────────────────────────────────

interface DrawerProps {
  node: LmsNode;
  onClose: () => void;
}

const NodeDrawer: FC<DrawerProps> = ({ node, onClose }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setText('');
    setLoading(true);
    setCached(false);

    cleanupRef.current = streamNodeExplanation(
      node.id,
      (chunk, isCached) => {
        setText((prev) => prev + chunk);
        if (isCached) setCached(true);
        setLoading(false);
      },
      () => setLoading(false),
      () => setLoading(false),
    );

    return () => cleanupRef.current?.();
  }, [node.id]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--tg-theme-bg-color, #fff)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
          maxHeight: '65vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3, flex: 1, paddingRight: 12 }}>
            {node.label}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {cached && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            из кэша
          </span>
        )}

        {loading && !text && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Генерирую объяснение…</p>
        )}

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {text}
          {loading && text && <span style={{ opacity: 0.4 }}>▌</span>}
        </p>
      </div>
    </div>
  );
};

// ─── Join org screen ──────────────────────────────────────────────────────────

interface JoinScreenProps {
  onJoined: (org: LmsOrg) => void;
  userKey: string;
}

const JoinScreen: FC<JoinScreenProps> = ({ onJoined, userKey: key }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await joinOrg(code.trim(), key);
      const orgs = await getUserOrgs(key);
      const joined = orgs.find((o) => o.org_id === result.org_id);
      if (joined) onJoined(joined);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20, padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>🧠</div>
      <h2 style={{ margin: 0, fontSize: 20 }}>Присоединитесь к команде</h2>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
        Введите код приглашения от вашего менеджера
      </p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Код приглашения"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 12,
          border: '1.5px solid var(--border)', fontSize: 15,
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          outline: 'none', boxSizing: 'border-box',
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />

      {error && <p style={{ margin: 0, color: 'var(--error)', fontSize: 13 }}>{error}</p>}

      <button
        onClick={handleJoin}
        disabled={!code.trim() || loading}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15,
          background: code.trim() && !loading ? 'var(--primary)' : 'var(--border)',
          color: code.trim() && !loading ? '#fff' : 'var(--text-secondary)',
          border: 'none', cursor: code.trim() && !loading ? 'pointer' : 'default',
        }}
      >
        {loading ? 'Подключение…' : 'Войти в команду'}
      </button>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const GraphPage: FC = () => {
  const { user } = useAuthContext();
  const [org, setOrg] = useState<LmsOrg | null>(null);
  const [graph, setGraph] = useState<{ nodes: LmsNode[]; edges: { source: number; target: number }[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<LmsNode | null>(null);
  const [status, setStatus] = useState<'loading' | 'no-org' | 'ready' | 'empty' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const key = user ? userKey(user) : '';

  const loadGraph = useCallback(async (o: LmsOrg) => {
    try {
      const g = await getOrgGraph(o.org_id);
      setGraph(g);
      setStatus(g.nodes.length === 0 ? 'empty' : 'ready');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!key) return;
    getUserOrgs(key)
      .then((orgs) => {
        if (orgs.length === 0) {
          setStatus('no-org');
        } else {
          const first = orgs[0];
          setOrg(first);
          loadGraph(first);
        }
      })
      .catch((e) => {
        setError(e.message);
        setStatus('error');
      });
  }, [key, loadGraph]);

  const flowNodes = useMemo(() => (graph ? buildFlowNodes(graph.nodes) : []), [graph]);
  const flowEdges = useMemo(() => (graph ? buildFlowEdges(graph.edges) : []), [graph]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      const lmsNode = graph?.nodes.find((n) => String(n.id) === node.id);
      if (lmsNode?.is_available) setSelectedNode(lmsNode);
    },
    [graph],
  );

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
      </div>
    );
  }

  if (status === 'no-org') {
    return <JoinScreen userKey={key} onJoined={(o) => { setOrg(o); setStatus('loading'); loadGraph(o); }} />;
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 12 }}>
        <p style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 12, textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 48 }}>📚</div>
        <h3 style={{ margin: 0 }}>Курс ещё не создан</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          Менеджер {org?.org_name} добавит материалы
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{org?.org_name}</p>
        <h2 style={{ margin: '2px 0 0', fontSize: 18 }}>Граф знаний</h2>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '0 16px 10px', fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
        <span>✅ пройдено</span>
        <span style={{ color: 'var(--primary)' }}>● доступно</span>
        <span>● заблокировано</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, paddingBottom: '60px' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={NODE_TYPES}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.4}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="var(--border)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
};

export default GraphPage;
