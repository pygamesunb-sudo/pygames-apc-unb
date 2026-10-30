import TutorConversationItem from './TutorConversationItem';

export default function TutorConversationGroup({ group, activeId, archiveLabel, onOpen, onRename, onArchive }) {
  return (
    <section className="tutor-history__group">
      <h3>{group.label}</h3>
      {group.items.map((item) => (
        <TutorConversationItem
          key={item.conversation_id}
          item={item}
          active={item.conversation_id === activeId}
          archiveLabel={archiveLabel}
          onOpen={onOpen}
          onRename={onRename}
          onArchive={onArchive}
        />
      ))}
    </section>
  );
}
