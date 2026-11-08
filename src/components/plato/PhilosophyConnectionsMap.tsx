'use client';

import { useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, MarkerType, useNodesState, useReactFlow, type Node, type NodeProps, type Edge } from '@xyflow/react';
import { ArrowUpRight, Maximize2 } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import type { ImmersivePhilosopher, ConnectionKind, ConnectionPerson } from '@/data/plato-types';
import '@xyflow/react/dist/style.css';
import './connections.css';

const kinds: Record<ConnectionKind, { title: string; color: string; dash?: string }> = {
  teaching: { title: 'Учитель и ученик', color: '#65764d' },
  influence: { title: 'Влияние идей', color: '#79857e', dash: '7 5' },
  criticism: { title: 'Философская критика', color: '#a47759', dash: '2 5' },
  development: { title: 'Развитие учения', color: '#777295', dash: '10 4 2 4' },
};
const confidence = { established: 'Подтверждённая связь', qualified: 'С историческими оговорками', disputed: 'Спорная атрибуция' };

type PersonNode = Node<{ person: ConnectionPerson; central: boolean; onSelect?: () => void }, 'person'>;
function PhilosopherNode({ data, selected }: NodeProps<PersonNode>) {
  return <div className={`connection-person ${data.central ? 'is-central' : ''} ${selected ? 'is-selected' : ''}`} title={data.person.summary} role="button" tabIndex={0} aria-label={`${data.person.name}. ${data.person.summary}`} onClick={data.onSelect} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); data.onSelect?.();}}}>
    <Handle type="target" position={Position.Left} id="left-in" />
    <Handle type="source" position={Position.Left} id="left-out" />
    <Handle type="target" position={Position.Right} id="right-in" />
    <Handle type="source" position={Position.Right} id="right-out" />
    <Handle type="source" position={Position.Left} id="criticism-out" style={{top:'80%'}} />
    <Handle type="target" position={Position.Right} id="criticism-in" style={{top:'80%'}} />
    {data.person.portrait ? <img src={data.person.portrait} alt="" loading="lazy" width={42} height={48} draggable={false} /> : <span className="connection-monogram" aria-hidden="true">{data.person.name[0]}</span>}
    <div><small>{data.central ? 'В ЦЕНТРЕ РАЗГОВОРА' : data.person.kind === 'school' ? 'ТРАДИЦИЯ' : 'МЫСЛИТЕЛЬ'}</small><strong>{data.person.name}</strong><span>{data.person.dates}</span></div>
  </div>;
}
const nodeTypes = { person: PhilosopherNode };
const positions = [{ x: 440, y: 235 }, { x: 35, y: 25 }, { x: 835, y: 125 }, { x: 35, y: 235 }, { x: 35, y: 445 }, { x: 835, y: 435 }];

function MapContent({ profile, onOpenPhilosopher }: { profile: ImmersivePhilosopher; onOpenPhilosopher: (id: string) => void }) {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState<ConnectionKind[]>(['teaching', 'influence', 'criticism', 'development']);
  const [selectedId, setSelectedId] = useState(profile.connections[0]?.id);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const { fitView } = useReactFlow();
  const initialNodes = useMemo<PersonNode[]>(() => profile.people.map((person, index) => ({
    id: person.id, type: 'person', position: positions[index] ?? { x: (index % 3) * 400, y: Math.floor(index / 3) * 200 },
    data: { person, central: person.id === profile.id }, ariaLabel: `${person.name}. ${person.summary}`,
  })), [profile]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const visibleConnections = profile.connections.filter(connection => enabled.includes(connection.type));
  const visibleIds = new Set([profile.id, ...visibleConnections.flatMap(connection => [connection.source, connection.target])]);
  const current = visibleConnections.find(connection => connection.id === selectedId) ?? visibleConnections[0];
  const selectedPerson = current && profile.people.find(person => person.id === (current.source === profile.id ? current.target : current.source));
  const hoveredPerson = profile.people.find(person => person.id === hoverId);
  const positionById = Object.fromEntries(nodes.map(node => [node.id, node.position.x]));
  const edges: Edge[] = visibleConnections.map(connection => {
    const leftToRight = positionById[connection.source] < positionById[connection.target];
    return {
      id: connection.id, source: connection.source, target: connection.target,
      sourceHandle: connection.type === 'criticism' ? 'criticism-out' : leftToRight ? 'right-out' : 'left-out', targetHandle: connection.type === 'criticism' ? 'criticism-in' : leftToRight ? 'left-in' : 'right-in',
      type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: kinds[connection.type].color, width: 18, height: 18 },
      style: { stroke: kinds[connection.type].color, strokeWidth: current?.id === connection.id ? 3 : 2, strokeDasharray: kinds[connection.type].dash },
      ariaLabel: connection.label, focusable: true,
      domAttributes: {onKeyDown: event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); setSelectedId(connection.id);}}},
    };
  });
  const selectPerson = (id: string) => {
    const connection = visibleConnections.find(item => item.source === id || item.target === id);
    if (connection) setSelectedId(connection.id);
  };
  const toggleKind = (type: ConnectionKind) => setEnabled(previous => previous.includes(type) ? previous.filter(item => item !== type) : [...previous, type]);

  return <div className="plato-connections" data-testid="connections-map">
    <div className="connection-filters" role="group" aria-label="Типы философских связей">
      {(Object.entries(kinds) as [ConnectionKind, typeof kinds[ConnectionKind]][]).map(([type, kind]) => <button type="button" key={type} aria-pressed={enabled.includes(type)} onClick={() => toggleKind(type)}><i style={{ borderColor: kind.color, borderStyle: kind.dash ? 'dashed' : 'solid' }} />{kind.title}</button>)}
    </div>
    <div className="connection-layout">
      <div className="connection-canvas-wrap">
        <div className="connection-canvas" aria-label={`Интерактивная карта: ${profile.name}`}>
          <ReactFlow<PersonNode>
            nodes={nodes.filter(node => visibleIds.has(node.id)).map(node => ({ ...node, data: {...node.data,onSelect: () => selectPerson(node.id)}, selected: !!current && (node.id === current.source || node.id === current.target) }))}
            edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
            onNodeClick={(_, node) => selectPerson(node.id)} onEdgeClick={(_, edge) => setSelectedId(edge.id)}
            onNodeMouseEnter={(_, node) => setHoverId(node.id)} onNodeMouseLeave={() => setHoverId(null)}
            onNodeDragStart={() => setHoverId(null)} fitView fitViewOptions={{ padding: .14 }} minZoom={.3} maxZoom={1.8}
            nodesConnectable={false} nodesFocusable={false} edgesReconnectable={false} deleteKeyCode={null} panOnScroll={false} zoomOnScroll={false}
            ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': 'Увеличить карту', 'controls.zoomOut.ariaLabel': 'Уменьшить карту', 'controls.fitView.ariaLabel': 'Показать всю карту', 'controls.interactive.ariaLabel': 'Переключить управление картой' }}
          >
            <Background color="#a6aa99" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
          {hoveredPerson && <div className="connection-hover" role="status"><strong>{hoveredPerson.name}</strong><p>{hoveredPerson.summary}</p></div>}
        </div>
        <div className="connection-map-caption"><span>Тяните фон и узлы. Масштаб — кнопками или жестом двух пальцев.</span><button type="button" onClick={() => fitView({ padding: .14, duration: reduced ? 0 : 300 })}><Maximize2 size={15} />Вся карта</button></div>
      </div>
      <aside className="connection-detail" aria-label="Описание выбранной связи">
        {current && selectedPerson ? <><span className="connection-category">{kinds[current.type].title}</span><h3>{selectedPerson.name}</h3><p className="connection-dates">{selectedPerson.dates}</p><p className="connection-direction">{profile.people.find(person => person.id === current.source)?.name} → {profile.people.find(person => person.id === current.target)?.name}</p><h4>{current.label}</h4><p>{current.description}</p>{current.note && <p className="connection-note">{current.note}</p>}<small>{confidence[current.confidence]}</small><div className="connection-sources">{current.sourceIds.map(id => { const source = profile.sources.find(item => item.id === id); return source && <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={13} /></a>; })}</div>{selectedPerson.href && <button type="button" className="text-link" onClick={() => onOpenPhilosopher(selectedPerson.id)}>Открыть страницу<ArrowUpRight size={16} /></button>}</> : <p role="status">Все типы связей скрыты. Включите любой фильтр, чтобы продолжить разговор.</p>}
      </aside>
    </div>
    <div className="connection-accessible-list" role="group" aria-label="Выбрать связь — доступный список">
      {visibleConnections.map(connection => <button type="button" key={connection.id} aria-pressed={current?.id === connection.id} onClick={() => setSelectedId(connection.id)}><span style={{ color: kinds[connection.type].color }}>↗</span><strong>{profile.people.find(person => person.id === connection.source)?.name} → {profile.people.find(person => person.id === connection.target)?.name}</strong><small>{connection.label}</small></button>)}
    </div>
    <p className="connection-editorial-note">Направление стрелки зависит от типа связи. Личное ученичество, влияние идей и посмертное развитие учения различаются. На телефоне можно выбрать связь из доступного списка связей.</p>
  </div>;
}

export default function PhilosophyConnectionsMap(props: { profile: ImmersivePhilosopher; onOpenPhilosopher: (id: string) => void }) {
  return <ReactFlowProvider><MapContent {...props} /></ReactFlowProvider>;
}
